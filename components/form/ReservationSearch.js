import {FormProvider, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SelectField from './SelectField';
import React, {useEffect, useState} from "react";
import {Alert, Form, Modal, ModalBody, ModalContent, ModalHeader, Switch} from "@nextui-org/react";
import DateRangePickerCompatible from "@/components/form/DateRangePickerCompatible";
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
        console.log("reset filter");
        handleResetAllFilters();
        userEntriesRefetch();
        setIsSubmitted(false);
        setData(null);

    }

    const isAvailable = async ({queryKey}) => {
        const [_, data] = queryKey;
        console.log("--------------------------- CRASH AFTER ------------------------");

        // Format the dates properly from the form data

        const startDate = data.date.start.toISOString();
        const endDate = data.date.end.toISOString();
        console.log(startDate, endDate);

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/reservation/?siteId=${data.site.id}&categoryId=${data.category.id}&domainId=${data.site.id}&startDate=${startDate}&endDate=${endDate}${data.resource !== null ? "&resourceId=" + data.resource.id : ""}`
        );
        console.log("--------passed---------")
        setIsSubmitted(false);
        if (response.status === 200) {
            addToast({
                title: 'Ressources disponibles récupérées avec succès',
                color: 'success',
                duration: 5000,
                variant: "flat",
            });
            return await response.json();
        } else if (response.status === 404) {
            addToast({
                title: 'Aucune ressource disponible',
                description: "Essayer un autre intervalle de date ou d'autres critères.",
                color: 'warning',
                duration: 5000,
                variant: "flat",
            });
        } else {
            addToast({
                title: 'Une erreur est survenue',
                color: 'danger',
                duration: 5000,
                variant: "flat",
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
            setIsModalOpen(false); // Ferme le modal après la soumission sur mobile
        }
    };

    console.log(watch("date"));
    return (
        <div>
            <AlternativeMenu
                user={session?.user}
                handleSearchMode={handleSearchMode}
                userEntriesQuantity={userEntries?.filter((entry) => entry.moderate === "USED" || entry.moderate === "ACCEPTED" || entry.moderate === "WAITING").length}
                handleRefresh={handleRefresh}
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
                        <div className='h-full w-full flex items-center flex-col'>
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
                                            <MagnifyingGlassIcon width="32" height="32" className="rounded-full"/>
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
                                                            label="Resources"
                                                            options={watch('category') && watch('site') ? `resources/?categoryId=${watch('category')?.id}&domainId=${watch('site')?.id}&status=AVAILABLE` : null}
                                                            isRequired={false}
                                                            onReset={handleResourceOnReset}
                                                            placeholder={"Toutes les ressources"}
                                                        />
                                                        <DateRangePickerSplitted
                                                            setValue={setValue}/>
                                                        
                                                        <div className="flex flex-col justify-center items-center">
                                                            <span
                                                                className="text-xs text-neutral-800 dark:text-neutral-200">Récurrent</span>
                                                            <Switch
                                                                size="sm"
                                                                name="allday"
                                                                id="allday"
                                                                color="default"
                                                                className="mb-2"
                                                                isSelected={isRecurrent}
                                                                onValueChange={(value) => {
                                                                    setIsRecurrent(value);
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
                                                                <DateRangePickerCompatible
                                                                    name={"recursive_range"}
                                                                    disabled={!isRecurrent}
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
                                          className={`bg-slate-50 dark:bg-neutral-800 ${searchMode ? 'opacity-100' : 'opacity-0'} duration-500 opacity-100 transition-opacity ease-out xl:w-3/5 lg:w-full sm:w-full mx-2 p-3 shadow-lg rounded-xl border-1 border-neutral-200 dark:border-neutral-700`}>
                                        <div className="flex flex-row w-full">
                                            <div className="flex flex-col order-1 w-full">
                                                <div className="flex flex-col w-full">
                                                    <div className='grid grid-cols-3 w-full gap-2'>
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
                                                            label="Resources"
                                                            options={watch('category') && watch('site') ? `resources/?categoryId=${watch('category')?.id}&domainId=${watch('site')?.id}&status=AVAILABLE` : null}
                                                            isRequired={false}
                                                            onReset={handleResourceOnReset}
                                                            placeholder={"Toutes les ressources"}
                                                        />
                                                    </div>
                                                    <div className='flex w-full items-center justify-center gap-4'>
                                                        <DateRangePickerSplitted setValue={setValue}/>
                                                        <div
                                                            className="flex flex-col justify-center items-center min-w-[100px]">
                                                            <span
                                                                className="text-xs text-neutral-800 dark:text-neutral-200">
                                                                Récurrent
                                                            </span>
                                                            <Switch
                                                                size="sm"
                                                                name="allday"
                                                                id="allday"
                                                                color="default"
                                                                className="mb-2"
                                                                isSelected={isRecurrent}
                                                                onValueChange={setIsRecurrent}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div
                                                    className={`transition-all duration-300 ease-in-out ${isRecurrent ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                                    <div className="flex gap-4 w-full">
                                                        <div className="w-1/3">
                                                            <SelectField
                                                                name="recursive_unit"
                                                                label="Fréquence"
                                                                options={"recursive_units"}
                                                                disabled={!isRecurrent}
                                                                isRequired={false}
                                                            />
                                                        </div>
                                                        <div className="w-2/3">
                                                            <DateRangePickerCompatible
                                                                name={"recursive_range"}
                                                                disabled={!isRecurrent}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-auto order-2 flex justify-center items-center">
                                                <Button
                                                    isIconOnly
                                                    size="lg"
                                                    radius="full"
                                                    color={"default"}
                                                    type="submit"
                                                    className="ml-6"
                                                    shadow="md"
                                                    isLoading={isSubmitted}
                                                >
                                                    <span className="flex justify-center items-center rounded-full">
                                                        <MagnifyingGlassIcon width="32" height="32"
                                                                             className="rounded-full"/>
                                                    </span>
                                                </Button>
                                            </div>
                                        </div>
                                    </Form>

                                </FormProvider>
                            )}
                            {!isSubmitted && !availableResources && (
                                        <div className="w-full rounded-lg p-2 h-full space-y-11 flex flex-col">
                                            <div
                                                className="h-full flex justify-center items-center mt-10 p-10 text-xl dark:text-neutral-300 text-neutral-600 opacity-75">
                                                Pour commencer faites une recherche
                                            </div>
                                        </div>
                            )}
                        </div>
                    )}
                    {searchMode === "search" && delayed === 0 &&  (
                        <div className="flex xl:w-3/5  lg:w-full mx-2 shadow-none rounded-xl mt-4 h-full ">
                            <div className="h-full w-full space-y-5 p-2 rounded-lg">
                                <div className={`rounded-lg flex justify-center items-center flex-col w-full`}>
                                    {availableResources && (
                                        <MatchingEntriesTable
                                            resources={availableResources}
                                            methods={methods}
                                            entry={data}
                                            session={session}
                                            handleRefresh={handleRefresh}
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