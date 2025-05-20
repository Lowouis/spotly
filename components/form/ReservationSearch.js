import {FormProvider, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {parseDate} from '@internationalized/date';
import SelectField from './SelectField';
import React, {useEffect, useState} from "react";
import {Alert, Form, Modal, ModalBody, ModalContent, ModalHeader, Switch} from "@nextui-org/react";
import {AlternativeMenu} from "@/components/menu";
import {MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {Button} from "@nextui-org/button";
import ReservationUserListing from "@/components/listing/Listings";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useSession} from "next-auth/react";
import MatchingEntriesTable from "@/components/listing/MatchingEntriesTable";
import {addToast} from "@heroui/toast";
import {useMediaQuery} from 'react-responsive';
import DateRangePickerSplitted from '@/components/form/DateRangePickerSplitted';
import {DatePicker} from "@nextui-org/date-picker";
import {Tooltip} from '@heroui/react';
import {IoEarthOutline} from "react-icons/io5";
import {BiCategory} from "react-icons/bi";
import {CiCalendarDate, CiSearch} from "react-icons/ci";
import {AnimatePresence, motion} from "framer-motion";

const schemaFirstPart = yup.object().shape({
    site: yup.object().required('Vous devez choisir un site'),
    category: yup.object().required('Vous devez choisir une ressource'),
    resource: yup.object().optional().default(null).nullable(),
    date: yup.object().required('Vous devez choisir une date'),
});

const ReservationSearch = () => {
    const { data: session  } = useSession();
    const queryClient = useQueryClient();
    const [searchMode, setSearchMode] = useState("search");
    const [data, setData] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isRecurrent, setIsRecurrent] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isMobile = useMediaQuery({query: '(max-width: 768px)'}); // Détecte les écrans de moins de 768px

    const methods = useForm({
        resolver: yupResolver(schemaFirstPart),
        mode: 'onSubmit',
    });

    const { watch, setValue} = methods;

    const handleSearchMode = (current) => {
        setSearchMode(current);
    }

    const handleRefresh = ()=>{
        handleResetAllFilters();
        userEntriesRefetch();
        setIsSubmitted(false);
        setData(null);

        setIsRecurrent(false);

    }

    const handleRefreshOnCreateEntry = () => {
        handleRefresh();
        setSearchMode("bookings");
    }

    const isAvailable = async ({queryKey}) => {
        const [_, data] = queryKey;

        const startDate = data.date.start.toISOString();
        const endDate = data.date.end.toISOString();


        const limit = new Date(watch('recursive_limit'));
        console.log(limit);
        const reccurent = isRecurrent ? `&recurrent_limit=${limit ?? limit}&recurrent_unit=${watch('recursive_unit')?.name}` : undefined;
        console.log("------- DATA BLOCKED 1 -------");

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/reservation/?${reccurent && reccurent}&siteId=${data.site.id}&categoryId=${data.category.id}&domainId=${data.site.id}&startDate=${startDate}&endDate=${endDate}${data.resource !== null ? "&resourceId=" + data.resource.id : ""}`
        ).catch((error) => {
            console.error('Error fetching data:', error);
            throw error;
        })
        console.log("------- DATA BLOCKED 2 -------");
        
        setIsSubmitted(false);
        if (response.status === 200) {
            addToast({
                title: 'Ressources disponibles récupérées avec succès',
                color: 'success',
                duration: 5000,
            });
            return await response.json();
        } else if (response.status === 404) {
            addToast({
                title: 'Aucune ressource disponible',
                description: "Essayer un autre intervalle de date ou d'autres critères.",
                color: 'warning',
                duration: 5000,
            });
        } else {
            addToast({
                title: 'Une erreur est survenue',
                color: 'danger',
                duration: 5000,
            });
        }
        ;
        setIsSubmitted(false);
        

        return null;
    }

    const { data: userEntries, refetch : userEntriesRefetch } = useQuery({
        queryKey: ['userEntries', session?.user?.id],
        queryFn: async ({ queryKey }) => {
            const userId = queryKey[1];
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/?userId=${userId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }
    });

    const [delayed, setDelayed] = useState(0);
    const [resetKeytResetKey] = useState(0);

    useEffect(() => {
        if (userEntries) {
            setDelayed(userEntries.filter((entry) => entry.moderate === "USED" && new Date(entry.endDate) < new Date()).length);
        }
    }, [userEntries]);

    const {data: availableResources, refetch: refetchARD} = useQuery({
        queryKey: ['isAvailable', data],
        queryFn: isAvailable,
        enabled: isSubmitted,
    });

    const handleResourceOnReset = () => {
        setValue('resource', null);
        setData({...data, resource: null});
        queryClient.invalidateQueries({queryKey: ['resource']});
        methods.trigger('resource');
    }

    const handleResetAllFilters = ()=>{
        methods.reset({
            site : null,
            category : null,
            resource : null,
            date : null,
        });
        setData(null);
        queryClient.invalidateQueries({queryKey: ['isAvailable']})
        queryClient.invalidateQueries(['domains']);
        queryClient.invalidateQueries(['categories']);
        queryClient.invalidateQueries(['resources']);
        setIsRecurrent(false);
    }

    const onSubmit = (data) => {
        setData(data);
        setIsSubmitted(true);
        if (isMobile) {
            setIsModalOpen(false);
        }
    };


    const isRecurrentValid = (unit) => {
        const startDate = watch('date')?.start;
        const endDate = watch('date')?.end;

        if (!startDate || !endDate) return false;

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Vérifier que la date de fin est après la date de début
        if (end <= start) return false;

        const diffInMilliseconds = end.getTime() - start.getTime();
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

        switch (unit) {
            case "jour":
                // Pour une récurrence journalière, vérifier que c'est le même jour
                return start.getDate() === end.getDate() &&
                    start.getMonth() === end.getMonth() &&
                    start.getFullYear() === end.getFullYear();

            case "hebdomadaire":
                // Pour une récurrence hebdomadaire, vérifier que c'est moins d'une semaine
                return diffInHours <= 24 * 7;

            default:
                return false;
        }
    };

    const getOngoingAndDelayedEntries = () => {
        const ongoingEntries = userEntries?.filter((entry) => entry.moderate === "USED" || entry.moderate === "ACCEPTED" || entry.moderate === "WAITING");
        const delayedEntries = ongoingEntries?.filter((entry) => new Date(entry.endDate) < new Date());
        return {
            total: ongoingEntries?.length + delayedEntries?.length,
            delayed: delayedEntries?.length > 0,
        };
    }

    const site = watch('site');
    const category = watch('category');
    const date = watch('date');

    let step = 1;
    if (site) step = 2;
    if (site && category) step = 3;
    if (site && category && date && date.start && date.end) step = 4;

    const stepConfig = [
        {
            icon: <IoEarthOutline size={50} color="blue"/>,
            text: "Commencez par choisir un site"
        },
        {
            icon: <BiCategory size={50} color="purple"/>,
            text: "Choisissez une catégorie"
        },
        {
            icon: <CiCalendarDate size={50} color="orange"/>,
            text: "Choisissez une date"
        },
        {
            icon: <CiSearch size={50} color="blue"/>,
            text: "Vous pouvez commencer votre recherche"
        }
    ];

    return (
        <div>
            <AlternativeMenu
                user={session?.user}
                handleSearchMode={handleSearchMode}
                userEntriesQuantity={getOngoingAndDelayedEntries()}
                handleRefresh={handleRefresh}
                selectedTab={searchMode}
            />
            <div className="flex flex-col md:w-full h-full">
                <div className="flex flex-col justify-center items-center h-full">
                    {searchMode === "search" && delayed !== 0 &&  (
                        <div className="flex flex-col justify-center items-center w-2/3 ">
                            <div className="flex flex-col justify-center items-center w-full ">
                                <Alert
                                    color="danger"
                                    variant="solid"
                                    title="Retard"
                                    description={
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">Vous avez des réservations en retard.</span>
                                        <span>Merci de vous rentre dans la section réservations pour restitué les ressources manquante pour pouvoir effectuer une nouvelle réservation.</span>
                                    </div>
                                    }
                                />
                            </div>
                        </div>
                    )}
                    {searchMode === "search" && delayed === 0 &&  (
                        <div
                            className="flex xl:w-3/5 sm:w-4/5 md:w-full lg:w-full mx-2 shadow-none rounded-xl mt-4 h-full">
                            <div className="h-full w-full space-y-5 p-2 rounded-lg">
                                <div className={`rounded-lg flex justify-center items-center flex-col w-full`}>
                                    {isMobile ? (
                                        <>
                                            <Button
                                                isIconOnly
                                                size="lg"
                                                radius="full"
                                                color={"default"}
                                                onPress={() => setIsModalOpen(true)}
                                                className="ml-6"
                                                shadow="md"
                                            >
                                                <span className="flex justify-center items-center rounded-full">
                                                    <MagnifyingGlassIcon width="32" height="32"
                                                                         className="rounded-full"/>
                                                </span>
                                            </Button>
                                            <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
                                                <ModalContent>
                                                    <ModalHeader>Recherche de Réservation</ModalHeader>
                                                    <ModalBody>
                                                        <FormProvider {...methods}>
                                                            <form onSubmit={methods.handleSubmit(onSubmit)}
                                                                  className="flex flex-col space-y-4">
                                                                <SelectField
                                                                    name="site"
                                                                    label="Site"
                                                                    options={"domains"}
                                                                    placeholder={"Choisir un site"}
                                                                />
                                                                <SelectField
                                                                    name="category"
                                                                    label="Catégorie"
                                                                    options={"categories"}
                                                                    onReset={handleResourceOnReset}
                                                                    placeholder={"Choisir une catégorie"}
                                                                />
                                                                <SelectField
                                                                    name="resource"
                                                                    awaiting={watch('category') === undefined && watch('site') === undefined}
                                                                    label="Ressources"
                                                                    options={watch('category') && watch('site') ? `resources/?categoryId=${watch('category')?.id}&domainId=${watch('site')?.id}` : null}
                                                                    isRequired={false}
                                                                    onReset={handleResourceOnReset}
                                                                    placeholder={"Toutes les ressources"}
                                                                />
                                                                <DateRangePickerSplitted
                                                                    setValue={setValue}/>

                                                                <div
                                                                    className="flex flex-col justify-center items-center">
                                                                    <span
                                                                        className="text-xs text-neutral-800 dark:text-neutral-200">Récurrent</span>
                                                                    <Switch
                                                                        size="sm"
                                                                        name="allday"
                                                                        id="allday"
                                                                        color={isRecurrentValid("hebdomadaire") ? "primary" : "default"}
                                                                        className="mb-2"
                                                                        isSelected={isRecurrentValid("hebdomadaire") && isRecurrent}
                                                                        onValueChange={(value) => {
                                                                            if (isRecurrentValid("hebdomadaire")) {
                                                                                setIsRecurrent(value);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div
                                                                    className={`transition-all duration-300 ease-in-out ${isRecurrent ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                                                    <div className="flex flex-row space-x-2 w-full">
                                                                        <SelectField
                                                                            name="recursive_unit"
                                                                            label="Fréquence"
                                                                            options={"recursive_units"}
                                                                            disabled={!isRecurrent}
                                                                            isRequired={false}
                                                                            className="mb-2"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <Button type="submit" color="primary" className="mt-4">
                                                                    Rechercher
                                                                </Button>
                                                            </form>
                                                        </FormProvider>
                                                    </ModalBody>
                                                </ModalContent>
                                            </Modal>
                                        </>
                                    ) : (
                                        <FormProvider {...methods}>
                                            <Form onSubmit={methods.handleSubmit(onSubmit)}
                                                  className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm mx-auto w-[90%] max-w-[1089px] p-4 shadow-lg rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50">
                                                <div className="flex flex-row w-full">
                                                    <div className="flex flex-col order-1 w-full">
                                                        <div className="flex flex-col w-full">
                                                            <div className='grid grid-cols-3 w-full gap-3'>
                                                                <SelectField
                                                                    onReset={handleResourceOnReset}
                                                                    name="site"
                                                                    label="Site"
                                                                    options={"domains"}
                                                                    placeholder={"Choisir un site"}
                                                                    classNames={{
                                                                        label: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                                                                        trigger: "bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary-400/50 dark:hover:border-primary-400/50 transition-colors",
                                                                        value: "text-neutral-800 dark:text-neutral-200",
                                                                        placeholder: "text-neutral-500 dark:text-neutral-400"
                                                                    }}
                                                                />
                                                                <SelectField
                                                                    name="category"
                                                                    label="Catégorie"
                                                                    options={"categories"}
                                                                    onReset={handleResourceOnReset}
                                                                    placeholder={"Choisir une catégorie"}
                                                                    classNames={{
                                                                        label: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                                                                        trigger: "bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary-400/50 dark:hover:border-primary-400/50 transition-colors",
                                                                        value: "text-neutral-800 dark:text-neutral-200",
                                                                        placeholder: "text-neutral-500 dark:text-neutral-400"
                                                                    }}
                                                                />
                                                                <SelectField
                                                                    name="resource"
                                                                    awaiting={watch('category') === undefined && watch('site') === undefined}
                                                                    label="Ressources"
                                                                    options={watch('category') && watch('site') ? `resources/?categoryId=${watch('category')?.id}&domainId=${watch('site')?.id}` : null}
                                                                    isRequired={false}
                                                                    onReset={handleResourceOnReset}
                                                                    placeholder={"Toutes les ressources"}
                                                                    classNames={{
                                                                        label: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                                                                        trigger: "bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary-400/50 dark:hover:border-primary-400/50 transition-colors",
                                                                        value: "text-neutral-800 dark:text-neutral-200",
                                                                        placeholder: "text-neutral-500 dark:text-neutral-400"
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className='flex w-full items-center gap-3 mt-3'>
                                                                <div className="flex-1">
                                                                    <DateRangePickerSplitted
                                                                        onChangeCheck={() => {
                                                                            if (!isRecurrentValid("hebdomadaire") || !setIsRecurrent("jour")) {
                                                                                setIsRecurrent(false);
                                                                            }
                                                                        }}
                                                                        setValue={setValue}
                                                                        classNames={{
                                                                            label: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                                                                            input: "bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary-400/50 dark:hover:border-primary-400/50 transition-colors",
                                                                            value: "text-neutral-800 dark:text-neutral-200",
                                                                            placeholder: "text-neutral-500 dark:text-neutral-400"
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div
                                                                    className="flex items-center gap-2 bg-neutral-50/50 dark:bg-neutral-800/20 px-3 py-2 rounded-xl backdrop-blur-sm border border-neutral-100/50 dark:border-neutral-700/20">
                                                                    <span
                                                                        className="text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                                                                        Récurrent
                                                                    </span>
                                                                    <Tooltip
                                                                        content={isRecurrentValid("hebdomadaire") ? "Cette option permet de faire plusieurs réservation de façon récurrente." : "Pour activer cette option, choisisez une période d'une semaine maximum."}
                                                                        color="foreground"
                                                                        showArrow
                                                                        placement="left"

                                                                    >
                                                                        <Switch
                                                                            size="sm"
                                                                            name="allday"
                                                                            id="allday"
                                                                            isReadOnly={!isRecurrentValid("hebdomadaire")}
                                                                            color={"primary"}
                                                                            isSelected={isRecurrentValid("hebdomadaire") && isRecurrent}
                                                                            onValueChange={(value) => {
                                                                                setIsRecurrent(value);
                                                                            }}
                                                                            classNames={{
                                                                                wrapper: "bg-neutral-200/50 dark:bg-neutral-700/50",
                                                                                thumb: "bg-white dark:bg-neutral-200"
                                                                            }}
                                                                        />
                                                                    </Tooltip>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div
                                                            className={`transition-all duration-300 ease-in-out ${isRecurrent ? 'opacity-100 max-h-24 mt-3' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                                            <div
                                                                className="flex gap-3 w-full bg-neutral-50/50 dark:bg-neutral-800/20 p-3 rounded-xl backdrop-blur-sm border border-neutral-100/50 dark:border-neutral-700/20">
                                                                <div className="w-1/2">
                                                                    <SelectField
                                                                        onReset={handleResourceOnReset}
                                                                        name="recursive_unit"
                                                                        label="Fréquence"
                                                                        options={"recursive_units"}
                                                                        disabled={!isRecurrent}
                                                                        isRequired={isRecurrent}
                                                                        validates={{
                                                                            "0": isRecurrentValid("jour"),
                                                                            "1": isRecurrentValid("hebdomadaire"),
                                                                        }}
                                                                        classNames={{
                                                                            label: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                                                                            trigger: "bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary-400/50 dark:hover:border-primary-400/50 transition-colors h-10",
                                                                            value: "text-neutral-800 dark:text-neutral-200",
                                                                            placeholder: "text-neutral-500 dark:text-neutral-400"
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="w-1/2">
                                                                    <DatePicker
                                                                        isRequired={isRecurrent}
                                                                        disabled={!isRecurrent}
                                                                        label="Jusqu'au"
                                                                        variant='bordered'
                                                                        size="sm"
                                                                        color="default"
                                                                        name="recursive_limit"
                                                                        isDisabled={watch('date')?.start === undefined}
                                                                        minValue={watch('date')?.end ? parseDate(watch('date').end.toISOString().split('T')[0]) : undefined}
                                                                        value={data?.recursive_limit ? parseDate(data.recursive_limit) : undefined}
                                                                        onChange={(value) => {
                                                                            setValue('recursive_limit', value.toString());
                                                                        }}
                                                                        className='justify-center items-center'
                                                                        classNames={{
                                                                            label: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                                                                            input: "bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border-neutral-200/50 dark:border-neutral-700/50 hover:border-primary-400/50 dark:hover:border-primary-400/50 transition-colors h-10",
                                                                            value: "text-neutral-800 dark:text-neutral-200",
                                                                            placeholder: "text-neutral-500 dark:text-neutral-400",
                                                                            base: "h-full"
                                                                        }}
                                                                        calendarProps={{
                                                                            classNames: {
                                                                                base: "bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50",
                                                                                headerWrapper: "pt-4",
                                                                                prevButton: "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                                                                                nextButton: "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                                                                                gridHeader: "border-b border-neutral-200/50 dark:border-neutral-700/50",
                                                                                cellButton: [
                                                                                    "data-[today=true]:text-primary",
                                                                                    "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
                                                                                    "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                                                                                    "rounded-md transition-colors",
                                                                                    "data-[today=true]:font-semibold",
                                                                                    "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
                                                                                    "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
                                                                                    "data-[in-range=true]:bg-primary/20",
                                                                                ],
                                                                            },
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="w-auto order-2 flex justify-center items-center ml-4">
                                                        <Button
                                                            isIconOnly
                                                            size="lg"
                                                            radius="full"
                                                            color="primary"
                                                            type="submit"
                                                            className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                                            isLoading={isSubmitted}
                                                        >
                                                            <span
                                                                className="flex justify-center items-center rounded-full">
                                                                <MagnifyingGlassIcon width="28" height="28"
                                                                             className="text-white"/>
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Form>
                                        </FormProvider>
                                    )}
                                    {!isSubmitted && !availableResources && !isMobile && (
                                        <div
                                            className="flex xl:w-3/5 sm:w-4/5 md:w-full lg:w-full mx-2 shadow-none rounded-xl mt-4 h-full">
                                            <div className="h-full w-full space-y-5 p-2 rounded-lg">
                                                <div
                                                    className={`rounded-lg flex justify-center items-center flex-col w-full`}>
                                                    <AnimatePresence mode="wait" initial={false}>
                                                        <motion.div
                                                            key={step}
                                                            initial={{opacity: 0, y: 40}}
                                                            animate={{opacity: 1, y: 0}}
                                                            exit={{opacity: 0, y: -40}}
                                                            transition={{duration: 0.4, type: "spring"}}
                                                            className="flex flex-col items-center space-y-8 text-center max-w-md"
                                                        >
                                                            <div
                                                                className="w-16 h-16 rounded-full bg-primary-50/50 dark:bg-primary-900/10 flex items-center justify-center backdrop-blur-sm border border-primary-100 dark:border-primary-800/20">
                                                                {stepConfig[step - 1].icon}
                                                            </div>
                                                            <div className="space-y-3">
                                                                <h3 className="text-2xl font-semibold bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                                                                    {stepConfig[step - 1].text}
                                                                </h3>
                                                            </div>
                                                        </motion.div>
                                                    </AnimatePresence>
                                                    <div
                                                        className="w-full rounded-lg p-4 h-full flex flex-col items-center justify-center mt-8">
                                                        <div
                                                            className="flex flex-col items-center space-y-8 text-center max-w-md">
                                                            <div
                                                                className="flex flex-col items-center space-y-4 text-sm text-neutral-500 dark:text-neutral-500 bg-neutral-50/50 dark:bg-neutral-800/20 p-4 rounded-xl backdrop-blur-sm border border-neutral-100 dark:border-neutral-700/20">
                                                                <div className="flex items-center space-x-3">
                                                                    <div
                                                                        className="w-2 h-2 rounded-full bg-primary-400/80 dark:bg-primary-400/60"/>
                                                                    <span>Choisissez une ressource</span>
                                                                </div>
                                                                <div className="flex items-center space-x-3">
                                                                    <div
                                                                        className="w-2 h-2 rounded-full bg-primary-400/80 dark:bg-primary-400/60"/>
                                                                    <span>Définissez une date</span>
                                                                </div>
                                                                <div className="flex items-center space-x-3">
                                                                    <div
                                                                        className="w-2 h-2 rounded-full bg-primary-400/80 dark:bg-primary-400/60"/>
                                                                    <span>Vérifiez les disponibilités</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {searchMode === "search" && delayed === 0 &&  (
                        <div
                            className="flex xl:w-3/5 sm:w-4/5 md:w-full lg:w-full mx-2 shadow-none rounded-xl mt-4 h-full ">
                            <div className="h-full w-full space-y-5 p-2 rounded-lg">
                                <div className={`rounded-lg flex justify-center items-center flex-col w-full`}>
                                    {availableResources && (
                                        <MatchingEntriesTable
                                            resources={availableResources}
                                            methods={methods}
                                            entry={data}
                                            session={session}
                                            handleRefresh={handleRefreshOnCreateEntry}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {searchMode === "bookings" && (<ReservationUserListing entries={userEntries} handleRefresh={handleRefresh} />)}
                </div>
            </div>
        </div>
    );
};

export {ReservationSearch};
