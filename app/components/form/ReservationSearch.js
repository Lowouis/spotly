import {FormProvider, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SelectField from './SelectField';
import React, {useEffect, useState} from "react";
import {Alert, Switch} from "@nextui-org/react";
import DateRangePickerCompatible from "@/app/components/form/DateRangePickerCompatible";
import {AlternativeMenu} from "@/app/components/menu";
import {MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {Button} from "@nextui-org/button";
import ReservationUserListing from "@/app/components/reservations/Listings";
import { constructDate } from "../../utils/global";
import {useQueryClient, useQuery} from "@tanstack/react-query";
import {useSession} from "next-auth/react";
import MatchingEntriesTable from "@/app/components/tables/MatchingEntriesTable";



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
    const [refresh, setRefresh] = useState(false);
    const [availableResources, setAvailableResources] = useState();
    const [data, setData] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isRecurrent, setIsRecurrent] = useState(false);
    const methods = useForm({
        resolver: yupResolver(schemaFirstPart),
        mode: 'onSubmit',
    });
    const [toast, setToast ] = useState({title: "", description: "", type: ""});

    const { watch, setValue} = methods;





    const handleSearchMode = (current) => {
        setSearchMode(current);
    }
    const handleRefresh = ()=>{
        setRefresh(true);
        handleResetAllFilters();
        userEntriesRefetch();
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

    //this section is dedicated to handle delayed stuff and contrain user to return theirs resources to search for another one
    const [delayed, setDelayed] = useState(0);

    useEffect(() => {
        if (userEntries) {
            setDelayed(userEntries.filter((entry) => entry.moderate === "USED" && new Date(entry.endDate) < new Date()).length);        }
    }, [userEntries]);



    const { data: matchingEntries, refetch : refetchMatchingEntries} = useQuery({
        queryKey: ['entries', data],
        queryFn: async ({ queryKey }) => {
            const [_, data] = queryKey;
            if (data) {
                const startDate = constructDate(data.date.start);
                const endDate = constructDate(data.date.end);
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/?siteId=${data.site}&categoryId=${data.category}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}${data.resource !== null ? "&resourceId=" + data.resource.id : ""}`
                );
                return await response.json();
            }
            return [];
        }
    });

    useEffect(() => {

        if (data) {
            refetchMatchingEntries();  // Déclencher le refetch quand isSubmitted change
        }
    }, [isSubmitted, data, refetchMatchingEntries]);

    useEffect(() => {
        const cpAvailableResources = queryClient.getQueryData(['resource', `resources/?categoryId=${watch('category')?.id}&domainId=${watch('site')?.id}&status=AVAILABLE`]);
        if (isSubmitted && matchingEntries && cpAvailableResources !== undefined) {
            console.log(cpAvailableResources);
            const filteredResourcesByMatches = cpAvailableResources.filter(
                (resource) =>
                    !matchingEntries?.some((entry) => entry.resourceId === resource.id)
            );

            const filteredResourcesByResources =
                data?.resource !== null
                    ? filteredResourcesByMatches?.filter(
                        (resource) => data.resource.id === resource.id
                    )
                    : filteredResourcesByMatches;

            setAvailableResources(filteredResourcesByResources || null);
            setIsSubmitted(false);
        }
    }, [availableResources, isSubmitted, matchingEntries, data, queryClient, watch]);

    /*useEffect(() => {
        if(refresh){
            console.log("refreshing");
            refetchResources().then(()=>{
                setRefresh(false);
            })
        }
    }, [setRefresh, refresh, refetchResources]);*/
    const handleResourceOnReset = ()=>{
        setValue('resource', null);
        setData({...data, resource: null});
        queryClient.removeQueries({ queryKey : ['resource'] });
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
        setAvailableResources(null);
        setIsRecurrent(false);
    }
    const onSubmit = (data) => {
        setData(data);
        setIsSubmitted(true);

    };
    if (!methods) {
        return <p>Error: Form could not be initialized</p>;
    }



    return (
        <div className="py-4">
            <AlternativeMenu
                user={session?.user}
                handleSearchMode={handleSearchMode}
                userEntriesQuantity={userEntries?.length}
                handleRefresh={handleRefresh}
            />
            <div className="flex flex-col md:w-full">
                <div className="flex flex-col justify-center items-center">
                    {searchMode === "search" && delayed !== 0 &&  (
                        <div className="flex flex-col justify-center items-center w-2/3">
                            <div className="flex flex-col justify-center items-center w-full">
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
                        <FormProvider {...methods}>
                            <form onSubmit={methods.handleSubmit(onSubmit)} className={`bg-slate-50  ${searchMode ? 'opacity-100' : 'opacity-0'} duration-500 opacity-100 transition-opacity ease-out 2xl:w-2/3 xl:w-4/5 lg:w-full sm:w-full mx-2 p-3 shadow-lg rounded-xl border-1 border-neutral-200`}>
                                <div className="flex flex-row">
                                    <div className="flex flex-col order-1 w-11/12">
                                        <div className="flex flex-row space-x-2 w-full">
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
                                            {/* ISSUE : ON RESET IT DOESN'T RESET STATE OF DATA SO IT'S NOT REFRESHING IN CASE WE DON'T WANT TO SEARCH FOR ALL RESOURCES   */}
                                            <SelectField
                                                name="resource"
                                                awaiting={watch('category') === undefined ||  watch('site') === undefined}
                                                label="Resources"
                                                options={`resources/?categoryId=${watch('category')?.id}&domainId=${watch('site')?.id}&status=AVAILABLE`}
                                                isRequired={false}
                                                onReset={handleResourceOnReset}
                                                placeholder={"Toutes les ressources"}
                                            />
                                            <DateRangePickerCompatible name={"date"} alternative={true}/>


                                            <div className="flex flex-col justify-center items-center">
                                                <span className="text-xs">Récurrent</span>
                                                <Switch
                                                    size="sm"
                                                    name="allday"
                                                    id="allday"
                                                    color="primary"
                                                    className="mb-2"
                                                    onClick={() => {
                                                        setIsRecurrent(!isRecurrent)
                                                    }}
                                                >

                                                </Switch>
                                            </div>
                                        </div>
                                        <div className={`flex flex-row space-x-2 w-full ${!isRecurrent && "hidden"}`}>
                                            <SelectField
                                                name="recursive_unit"
                                                label="Fréquence"
                                                options={"recursive_units"}
                                                disabled={!isRecurrent}
                                                isRequired={false}
                                                className="mb-2"
                                            />
                                            <DateRangePickerCompatible name={"recursive_range"} disabled={!isRecurrent}/>
                                        </div>
                                    </div>
                                    <div className="w-auto order-2 flex justify-center items-center">
                                        <Button
                                            isIconOnly
                                            size="lg"
                                            radius="full"
                                            color="primary"
                                            type="submit"
                                            className="ml-6"
                                            shadow="lg"
                                            isLoading={isSubmitted}
                                            spinner={
                                                <svg
                                                    className="animate-spin h-7 w-7 text-current"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        fill="currentColor"
                                                    />
                                                </svg>
                                            }
                                        >
                                            <span className="flex justify-center items-center rounded-full">
                                                <MagnifyingGlassIcon width="32" height="32" className="rounded-full" color="white"/>
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            </form>
                            <div className="w-2/3 my-2">
                                {/* USER TOAST */}
                                {toast.title !== "" && (
                                    <div className="flex items-center justify-center w-full mb-5">
                                        <Alert description={toast.description} title={toast.title} color={toast.type} variant="faded" radius="md"  isClosable={true} onClose={()=>{setToast({title: "",description: "", type: ""})}}/>
                                    </div>
                                )}
                            </div>

                            {!isSubmitted && !availableResources && (
                                <div className="h-full flex justify-center items-center mt-5 text-xl opacity-65">
                                    Pour commencer faite une recherche
                                </div>
                            )}
                        </FormProvider>
                    )}
                    {searchMode === "search" && delayed === 0 &&  (
                        <div className="flex 2xl:w-2/3 xl:w-4/5 lg:w-full sm:w-full mx-2 shadow-none rounded-xl mt-4 h-full ">
                            <div className="h-full w-full space-y-5 p-2 rounded-lg">
                                <div className={`rounded-lg flex justify-center items-center flex-col w-full`}>

                                    {availableResources && (
                                        <MatchingEntriesTable
                                            setData={setData}
                                            resources={availableResources}
                                            methods={methods}
                                            data={data}
                                            session={session}
                                            handleResetFetchedResources={()=>{setAvailableResources(null)}}
                                            handleRefresh={handleRefresh}
                                            setToast={setToast}
                                        />
                                    )
                                    }
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


