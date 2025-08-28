import {FormProvider, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {parseDate} from '@internationalized/date';
import {I18nProvider} from 'react-aria';
import SelectField from './SelectField';
import React, {useCallback, useEffect, useState} from "react";
import {Drawer, DrawerBody, DrawerContent, DrawerHeader, Form, Switch, Tooltip} from "@heroui/react";
import {AlternativeMenu} from "@/components/menu";
import {MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {Button} from "@heroui/button";
import ReservationUserListing from "@/components/listing/Listings";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useSession} from "next-auth/react";
import MatchingEntriesTable from "@/components/listing/MatchingEntriesTable";
import {addToast} from "@heroui/toast";
import {useMediaQuery} from 'react-responsive';
import DateRangePickerSplitted from '@/components/form/DateRangePickerSplitted';
import {DatePicker} from "@heroui/date-picker";
import {IoEarthOutline} from "react-icons/io5";
import {BiCategory} from "react-icons/bi";
import {CiCalendarDate} from "react-icons/ci";
import {AnimatePresence, motion} from "framer-motion";
import {useRouter, useSearchParams} from "next/navigation";

const schemaFirstPart = yup.object().shape({
    site: yup.object().required('Vous devez choisir un site'),
    category: yup.object().required('Vous devez choisir une ressource'),
    resource: yup.object().optional().default(null).nullable(),
    date: yup.object().required('Vous devez choisir une date'),
    recursive_limit: yup.string().when('isRecurrent', {
        is: true,
        then: (schema) => schema.required('Vous devez choisir une date de fin'),
        otherwise: (schema) => schema.optional()
    })
});

const ReservationSearch = () => {
    const { data: session  } = useSession();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const resIdParam = searchParams.get("resId");

    const [searchMode, setSearchMode] = useState("search");
    const [autoOpenResId, setAutoOpenResId] = useState(null);

    // Effet centralisé pour gérer les paramètres d'URL
    useEffect(() => {
        const newSearchParams = new URLSearchParams(searchParams);
        let urlHasChanged = false;

        if (tabParam) {
            setSearchMode(tabParam);
            newSearchParams.delete('tab');
            urlHasChanged = true;
        }

        if (resIdParam) {
            setAutoOpenResId(parseInt(resIdParam));
            newSearchParams.delete('resId');
            urlHasChanged = true;
        }

        if (urlHasChanged) {
            router.replace(`?${newSearchParams.toString()}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabParam, resIdParam]);

    const handleSearchMode = (current) => {
        setSearchMode(current);
        setAutoOpenResId(null); // Réinitialiser l'ID pour ne pas rouvrir le modal
    };

    const [data, setData] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isRecurrent, setIsRecurrent] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isMobile = useMediaQuery({query: '(max-width: 768px)'}); // Détecte les écrans de moins de 768px
    const router = useRouter();

    const methods = useForm({
        resolver: yupResolver(schemaFirstPart),
        mode: 'onSubmit',
    });

    const {watch, setValue, formState: {errors}} = methods;

    // Effet pour synchroniser l'état lors du changement de taille d'écran
    useEffect(() => {
        // Réinitialiser les erreurs lors du changement de layout
        if (Object.keys(errors).length > 0) {
            methods.clearErrors();
        }
    }, [isMobile, methods, errors]);

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

        // Gestion des paramètres récurrents
        let recurrentParams = '';
        if (isRecurrent && data.recursive_unit && data.recursive_limit) {
            const limit = new Date(data.recursive_limit);
            recurrentParams = `recurrent_limit=${limit.toISOString()}&recurrent_unit=${data.recursive_unit.name}&`;
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/reservation?${recurrentParams}siteId=${data.site.id}&categoryId=${data.category.id}&domainId=${data.site.id}&startDate=${startDate}&endDate=${endDate}${data.resource !== null ? "&resourceId=" + data.resource.id : ""}`
        ).catch((error) => {
            console.error('Error fetching data:', error);
            throw error;
        })
        
        setIsSubmitted(false);
        if (response.status === 200) {
            addToast({
                title: 'Ressources disponibles récupérées avec succès',
                color: 'success',
                duration: 5000,
            });
            return await response.json();
        } else if (response.status === 204) {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?userId=${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }
    });

    const [delayed, setDelayed] = useState(0);
    const [resetKeytResetKey] = useState(0);

    useEffect(() => {
        if (!userEntries) {
            setDelayed(0);
            return;
        }

        const numDelayed = userEntries.filter(
            (entry) => entry.moderate === "USED" && new Date(entry.endDate) < new Date()
        ).length;

        setDelayed(numDelayed);

        if (numDelayed > 0) {
            addToast({
                title: 'Retard',
                description: `Vous avez ${numDelayed} réservation${numDelayed > 1 ? 's' : ''} en retard.`,
                color: 'warning',
                duration: 5000,
            });
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

    const onSubmit = async (formData) => {
        console.log('DEBUG - onSubmit called with formData:', formData);
        
        // Vérifier si le formulaire est valide
        const isValid = await methods.trigger();
        console.log('DEBUG - Form validation result:', isValid);

        if (!isValid) {
            console.log('DEBUG - Form validation failed');
            addToast({
                title: 'Formulaire invalide',
                description: 'Veuillez remplir tous les champs requis',
                color: 'warning',
                duration: 5000,
            });
            return;
        }

        // Si isRecurrent est true, vérifier que les champs récurrents sont remplis
        if (isRecurrent) {
            const recursiveUnit = watch('recursive_unit');
            const recursiveLimit = watch('recursive_limit');

            if (!recursiveUnit || !recursiveLimit) {
                addToast({
                    title: 'Champs manquants',
                    description: 'Veuillez remplir la fréquence et la date de fin pour la récurrence',
                    color: 'warning',
                    duration: 5000,
                });
                return;
            }
        }

        // Ajouter les champs récurrents au formData si nécessaire
        const finalFormData = {
            ...formData,
            recursive_unit: isRecurrent ? watch('recursive_unit') : null,
            recursive_limit: isRecurrent ? watch('recursive_limit') : null
        };

        console.log('DEBUG - Final form data:', finalFormData);
        console.log('DEBUG - Setting isSubmitted to true');

        setData(finalFormData);
        setIsSubmitted(true);

        // Fermer le modal mobile et nettoyer les erreurs
        if (isMobile) {
            setIsModalOpen(false);
        }

        // Nettoyer les erreurs de validation
        methods.clearErrors();
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

    const handleDateChangeCheck = useCallback(() => {
        if (!isRecurrentValid("hebdomadaire") || !isRecurrentValid("jour")) {
            setIsRecurrent(false);
        }
    }, [isRecurrentValid, setIsRecurrent]);

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
            icon: <IoEarthOutline size={50} color="#6b7280"/>,
            text: "Commencez par choisir un site"
        },
        {
            icon: <BiCategory size={50} color="#6b7280"/>,
            text: "Choisissez une catégorie"
        },
        {
            icon: <CiCalendarDate size={50} color="#6b7280"/>,
            text: "Choisissez une date"
        },
        {
            icon: null,
            text: "Commencer votre recherche"
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
                <div className="flex flex-col justify-center items-center h-full w-full">
                    {searchMode === "search" && (
                        <div
                            className="flex w-full h-full"
                            role="search">
                            <div
                                className="h-full w-full space-y-5 md:border-b-0 border-b border-neutral-200 dark:border-neutral-800">
                                <div className={`rounded-lg flex justify-center items-center flex-col w-full`}>
                                    {isMobile ? (
                                        <>
                                            <div className="w-full ">
                                                <div className="w-full flex justify-center items-center py-4 px-4">
                                                    <div
                                                        className="flex w-full flex-col justify-center items-center gap-3 space-x-3 px-6 py-3 transition-all duration-200 cursor-pointer"
                                                        onClick={() => setIsModalOpen(true)}>
                                                        <span
                                                            className="flex justify-center items-center gap-2 opacity-50 font-medium">
                                                            <MagnifyingGlassIcon
                                                                className="w-8 h-8 text-neutral-800 dark:text-neutral-400"/>
                                                            Rechercher

                                                        </span>
                                                        <svg
                                                            className="w-8 h-8 text-neutral-600 dark:text-neutral-400"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M21 12l-9 9m0 0l-9-9"
                                                            />
                                                        </svg>


                                                    </div>
                                                </div>

                                            </div>
                                            <Drawer
                                                isOpen={isModalOpen}
                                                onOpenChange={setIsModalOpen}
                                                placement="top"
                                                size="full"
                                                classNames={{
                                                    base: "bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700",
                                                    header: "border-b border-neutral-200 dark:border-neutral-700 pb-4",
                                                    body: "py-6 px-4",
                                                    closeButton: "text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 dark:text-neutral-400 rounded-full p-4 text-lg transition-all justify-end items-center"
                                                }}
                                            >
                                                <DrawerContent>
                                                    <DrawerHeader className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex flex-col gap-1">
                                                                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                                                    Recherche de Réservation
                                                                </h2>

                                                            </div>
                                                        </div>
                                                    </DrawerHeader>
                                                    <DrawerBody>
                                                        <FormProvider {...methods}>
                                                            <form onSubmit={methods.handleSubmit(onSubmit)}
                                                                  className="flex flex-col space-y-6 h-full pb-20">
                                                                <SelectField
                                                                    name="site"
                                                                    label="Site"
                                                                    options={"domains"}
                                                                    placeholder={"Choisir un site"}
                                                                    classNames={{
                                                                        label: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                                                                        trigger: "bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors h-12",
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
                                                                        trigger: "bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors h-12",
                                                                        value: "text-neutral-800 dark:text-neutral-200",
                                                                        placeholder: "text-neutral-500 dark:text-neutral-400"
                                                                    }}
                                                                />
                                                                <SelectField
                                                                    name="resource"
                                                                    awaiting={watch('category') === undefined && watch('site') === undefined}
                                                                    label="Ressources"
                                                                    options={watch('category') && watch('site') ? `resources?categoryId=${watch('category')?.id}&domainId=${watch('site')?.id}` : null}
                                                                    isRequired={false}
                                                                    onReset={handleResourceOnReset}
                                                                    placeholder={"Toutes les ressources"}
                                                                    classNames={{
                                                                        label: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                                                                        trigger: "bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors h-12",
                                                                        value: "text-neutral-800 dark:text-neutral-200",
                                                                        placeholder: "text-neutral-500 dark:text-neutral-400"
                                                                    }}
                                                                />
                                                                <DateRangePickerSplitted
                                                                    onChangeCheck={handleDateChangeCheck}
                                                                    setValue={setValue}
                                                                    classNames={{
                                                                        label: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                                                                        input: "bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 text-sm focus:border-neutral-900 dark:focus:border-neutral-100 transition-colors duration-200",
                                                                        value: "text-neutral-800 dark:text-neutral-200",
                                                                        placeholder: "text-neutral-500 dark:text-neutral-400"
                                                                    }}
                                                                />

                                                                <div
                                                                    className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                                                    <Tooltip
                                                                        content={isRecurrentValid("hebdomadaire") ? "Cette option permet de faire plusieurs réservation de façon récurrente." : "Pour activer cette option, choisisez une période d'une semaine maximum."}
                                                                        color="foreground"
                                                                        showArrow
                                                                        placement="top"
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
                                                                                wrapper: "bg-neutral-200 dark:bg-neutral-700",
                                                                                thumb: "bg-white dark:bg-neutral-200"
                                                                            }}
                                                                        >
                                                                            Récurrent
                                                                        </Switch>
                                                                    </Tooltip>
                                                                </div>

                                                                <div
                                                                    className={`transition-all duration-300 ease-in-out ${isRecurrent ? 'opacity-100 max-h-24' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                                                    <div
                                                                        className="flex gap-3 w-full bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 flex-col">
                                                                        <div className="flex items-center w-full">
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
                                                                                    trigger: "bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors h-10",
                                                                                    value: "text-neutral-800 dark:text-neutral-200",
                                                                                    placeholder: "text-neutral-500 dark:text-neutral-400"
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="flex items-center w-full">
                                                                            <I18nProvider locale="fr-FR">
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
                                                                                    isInvalid={!!errors.recursive_limit}
                                                                                    errorMessage={errors.recursive_limit?.message}
                                                                                    className='justify-center items-center'
                                                                                    classNames={{
                                                                                        inputWrapper: "border-none",
                                                                                        base: "dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm",
                                                                                        input: "text-neutral-900 dark:text-neutral-100 font-semibold placeholder:text-neutral-500 dark:placeholder:text-neutral-400 border-none",
                                                                                        label: "text-neutral-800 dark:text-neutral-200 font-semibold",
                                                                                        calendarWrapper: "bg-white dark:bg-neutral-900 border-0 rounded-lg shadow-lg",
                                                                                    }}
                                                                                    calendarProps={{
                                                                                        classNames: {
                                                                                            base: "bg-background",
                                                                                            headerWrapper: "pt-4 bg-background",
                                                                                            prevButton: "border-1 border-default-200 rounded-small",
                                                                                            nextButton: "border-1 border-default-200 rounded-small",
                                                                                            gridHeader: "bg-background shadow-none border-b-1 border-default-100",
                                                                                            cellButton: [
                                                                                                "data-[today=true]:text-primary",
                                                                                                "data-[selected=true]:bg-primary data-[selected=true]:text-black",
                                                                                                "hover:bg-primary hover:text-primary-foreground",
                                                                                                "rounded-small transition-colors",
                                                                                                "data-[today=true]:font-semibold",
                                                                                                "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
                                                                                                "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
                                                                                                "data-[in-range=true]:bg-primary/20",
                                                                                            ],
                                                                                        },
                                                                                    }}
                                                                                />
                                                                            </I18nProvider>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <Button
                                                                    onPress={() => methods.handleSubmit(onSubmit)()}
                                                                    color="default"
                                                                    size="lg"
                                                                    radius="md"
                                                                    className="fixed bottom-4 left-4 right-4 h-12 font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 z-50"
                                                                >
                                                                    Rechercher
                                                                </Button>
                                                            </form>
                                                        </FormProvider>
                                                    </DrawerBody>
                                                </DrawerContent>
                                            </Drawer>
                                        </>
                                    ) : (
                                        <FormProvider {...methods}>
                                            <Form onSubmit={methods.handleSubmit(onSubmit)}
                                                  className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm mx-auto w-[95%] max-w-[1180px] p-4 shadow-lg rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50">
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
                                                                    options={watch('category') && watch('site') ? `resources?categoryId=${watch('category')?.id}&domainId=${watch('site')?.id}` : null}
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
                                                                        onChangeCheck={handleDateChangeCheck}
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
                                                                        >
                                                                            Récurrent
                                                                        </Switch>
                                                                    </Tooltip>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div
                                                            className={`transition-all duration-300 ease-in-out ${isRecurrent ? 'opacity-100 max-h-24 mt-3' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                                            <div
                                                                className="flex w-full backdrop-blur-sm ">
                                                                <div className="flex items-center w-3/4">
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
                                                                <div className="flex items-center w-1/4 mx-2">
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
                                                                        isInvalid={!!errors.recursive_limit}
                                                                        errorMessage={errors.recursive_limit?.message}
                                                                        className='justify-center items-center'
                                                                        classNames={{
                                                                            inputWrapper: "border-none",
                                                                            base: "dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm",
                                                                            input: "text-neutral-900 dark:text-neutral-100 font-semibold placeholder:text-neutral-500 dark:placeholder:text-neutral-400 border-none",
                                                                            label: "text-neutral-800 dark:text-neutral-200 font-semibold",
                                                                            calendarWrapper: "bg-white dark:bg-neutral-900 border-0 rounded-lg shadow-lg",
                                                                        }}
                                                                        calendarProps={{
                                                                            classNames: {
                                                                                base: "bg-background",
                                                                                headerWrapper: "pt-4 bg-background",
                                                                                prevButton: "border-1 border-default-200 rounded-small",
                                                                                nextButton: "border-1 border-default-200 rounded-small",
                                                                                gridHeader: "bg-background shadow-none border-b-1 border-default-100",
                                                                                cellButton: [
                                                                                    "data-[today=true]:text-primary",
                                                                                    "data-[selected=true]:bg-primary data-[selected=true]:text-black",
                                                                                    "hover:bg-primary hover:text-primary-foreground",
                                                                                    "rounded-small transition-colors",
                                                                                    "data-[today=true]:font-semibold",
                                                                                    // Range selection styles
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
                                                            color="default"
                                                            onPress={() => methods.handleSubmit(onSubmit)()}
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
                                            <div
                                                className="h-full w-full flex items-center justify-center p-2 rounded-lg">
                                                <div
                                                    className="rounded-lg flex justify-center items-center flex-col w-full">
                                                    <AnimatePresence mode="wait" initial={false}>
                                                        <motion.div
                                                            key={step}
                                                            initial={{opacity: 0, y: 40}}
                                                            animate={{opacity: 1, y: 0}}
                                                            exit={{opacity: 0, y: -40}}
                                                            transition={{duration: 0.4, type: "spring"}}
                                                            className="flex flex-col items-center space-y-8 text-center max-w-md"
                                                        >
                                                            {stepConfig[step - 1].icon && <div
                                                                className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                                {stepConfig[step - 1].icon}
                                                            </div>}
                                                            <div className="space-y-3">
                                                                <h3 className="text-2xl font-semibold bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
                                                                    {stepConfig[step - 1].text}
                                                                </h3>
                                                            </div>
                                                        </motion.div>
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {searchMode === "search" && (
                        <div
                            className="flex w-full mx-2 shadow-none rounded-xl mt-4 h-full">
                            <div className="h-full w-full space-y-5 p-1 rounded-lg">
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
                    {searchMode === "bookings" && (
                        <ReservationUserListing entries={userEntries} handleRefresh={handleRefresh}
                                                autoOpenResId={autoOpenResId}/>)}
                </div>
            </div>
        </div>
    );
};

export {ReservationSearch};
