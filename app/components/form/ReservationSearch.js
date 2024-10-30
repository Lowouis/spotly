import {FormProvider, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SelectField from './SelectField';
import React, {useEffect, useState} from "react";
import {parseZonedDateTime, Time} from "@internationalized/date";
import {Skeleton, Switch} from "@nextui-org/react";
import TimeInputCompatible from "@/app/components/form/timeInputCompatible";
import DateRangePickerCompatible from "@/app/components/form/DateRangePickerCompatible";
import AvailableTable from "@/app/components/tables/AvailableTable";
import {AlternativeMenu} from "@/app/components/menu";
import {MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {Button} from "@nextui-org/button";
import ReservationUserListing from "@/app/components/reservations/Listings";
import { constructDate } from "../../utils/global";
import {DateRangePicker} from "@nextui-org/date-picker";

const schemaFirstPart = yup.object().shape({
    site: yup.string().required('Vous devez choisir un site'),
    category: yup.string().required('Vous devez choisir une ressource'),
    resource: yup.object().optional().default(null).nullable(),
    date: yup.object().required('Vous devez choisir une date'),
    });


const ReservationSearch = ({session}) => {

    // switch search or reservation mode
    const [searchMode, setSearchMode] = useState(true);
    const [domains, setDomains] = useState();
    const [categories, setCategories] = useState();
    const [resources, setResources] = useState();
    const [availableResources, setAvailableResources] = useState();
    const [matchingEntries, setMatchingEntries] = useState();
    const [data, setData] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isRecurrent, setIsRecurrent] = useState(false);
    const methods = useForm({
        resolver: yupResolver(schemaFirstPart),
        mode: 'onSubmit',
    });
    const [userEntries, setUserEntries] = useState();


    const {watch, setValue} = methods;
    const watchSite = watch('site');
    const watchCategory = watch('category');



    const handleSearchMode = (tab) => {
        setSearchMode(tab==='search');
    }
    useEffect(() => {
        const fetchEntries = () => {
            if (session?.user) {
                fetch(`http://localhost:3000/api/entry/?userId=${session.user.id}`)
                    .then(response => response.text())
                    .then(text => {
                        try {
                            const data = JSON.parse(text)
                            setUserEntries(data);
                        } catch (error) {
                            console.error('Failed to parse JSON:', error);
                            console.error('Response text:', text);
                        }
                    })
                    .catch(error => {
                        console.error('Fetch error:', error);
                    });
            } else {
                setUserEntries(null);
            }
        }

        fetchEntries();
    }, [session, setUserEntries]);
    useEffect(() => {
        const fetchDomains = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/domains");
                const fetchedDomains = await response.json();
                setDomains(fetchedDomains);
            } catch (error) {
                console.error("Fetch error:", error);
            }
        };

        const fetchCategories = async () => {
            try {
                const response = await fetch("http://localhost:3000/api/categories");
                const fetchedCategories = await response.json();
                setCategories(fetchedCategories);
            } catch (error) {
                console.error("Fetch error:", error);
            }
        };

        fetchDomains();
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchResources = async () => {
            if (watchCategory && watchSite) {
                try {
                    const response = await fetch(
                        `http://localhost:3000/api/resources/?categoryId=${watchCategory}&domainId=${watchSite}`
                    );
                    const fetchedResources = await response.json();
                    setResources(fetchedResources);
                } catch (error) {
                    console.error("Fetch error:", error);
                }
            } else {
                setResources(null);
            }
        };

        fetchResources();
    }, [watchCategory, watchSite]);

    useEffect(() => {
        const fetchMatchingEntries = async () => {
            if (isSubmitted && data) {
                const startDate = constructDate(data.date.start);
                const endDate = constructDate(data.date.end);

                try {
                    const response = await fetch(
                        `http://localhost:3000/api/entry/?siteId=${data.site}&categoryId=${data.category}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}${data.resource !== null ? "&resourceId=" + data.resource.id : ""}`
                    );
                    const fetchedEntries = await response.json();
                    console.log("Fetched entries:", fetchedEntries);
                    setMatchingEntries(fetchedEntries);
                } catch (error) {
                    console.error("Fetch error:", error);
                }
            }
        };

        fetchMatchingEntries().then(r => console.log("Matching entries fetched"));
    }, [isSubmitted, data]); // Only run when isSubmitted or data changes

    useEffect(() => {
        if (isSubmitted && matchingEntries) {
            const cpAvailableResources = [...resources];
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
    }, [isSubmitted, matchingEntries, resources, data]);

    const handleResourceOnReset = ()=>{
        setValue('resource', null);
        setData({...data, resource: null});
        console.log("RESET");
    }
    const onSubmit = (data) => {
        setData(data);
        setIsSubmitted(true);
    };
    if (!methods) {
        return <p>Error: Form could not be initialized</p>;
    }

    const controlError = ()=>{
        console.log("------------------------------------");
        console.log("YUP SIDE")
        console.log("site", watch('site'));
        console.log("category",watch('category'));
        console.log("resource",watch('resource'));
        console.log("date",watch('date'));
        console.log("start hour",watch('starthour'));
        console.log("end hour",(watch('endhour')));
        console.log("STATES SIDE");
        console.log(data);
        console.log("------------------------------------");
    }

    return (
        <div className="py-4 bg-gradient-to-b from-neutral-50 ">
        <AlternativeMenu user={session?.user} handleSearchMode={handleSearchMode} userEntriesQuantity={userEntries?.length}/>
        <div className="flex flex-col md:w-full">
            <div className="flex flex-col justify-center items-center">
                    {(searchMode) &&  (
                        <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit)} className={`${searchMode ? 'opacity-100' : 'opacity-0'} duration-500 opacity-100 transition-opacity ease-out 2xl:w-2/3 xl:w-4/5 lg:w-full sm:w-full mx-2 p-3 shadow-lg rounded-xl border-1 border-neutral-200`}>
                            <div className="flex flex-row">
                                <div className="flex flex-col order-1 w-11/12">
                                    <div className="flex flex-row space-x-2 w-full">
                                        <SelectField
                                            name="site"
                                            label="Site"
                                            options={domains}
                                            className=""

                                        />
                                        <SelectField
                                            name="category"
                                            label="Catégorie"
                                            options={categories}
                                            className=""
                                        />
                                        {/* ISSUE : ON RESET IT DOESN'T RESET STATE OF DATA SO IT'S NOT REFRESHING IN CASE WE DON'T WANT TO SEARCH FOR ALL RESOURCES   */}
                                        <SelectField
                                            object={true}
                                            name="resource"
                                            label="Resources"
                                            options={resources}
                                            disabled={!resources}
                                            isRequired={false}
                                            onReset={handleResourceOnReset}
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
                                                onClick={(e) => {
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
                                            options={[{id: '1', name: 'Quotidien'}, {id: '2', name: 'Hébdomadaire '}, {
                                                id: '3',
                                                name: 'Mensuel'
                                            }]}
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

                        {!isSubmitted && !availableResources && (
                            <div className="h-full flex justify-center items-center mt-5 text-xl opacity-25">
                                Pour commencer faite une recherche
                            </div>
                        )}
                    </FormProvider>
                        )}
                {searchMode &&  (
                    <div className="flex 2xl:w-2/3 xl:w-4/5 lg:w-full sm:w-full mx-2 shadow-none rounded-xl mt-4 h-full ">
                        <div className="h-full w-full space-y-5 p-2 rounded-lg">
                            <div className={`rounded-lg flex justify-center items-center flex-col w-full`}>
                                {availableResources && (
                                    <AvailableTable setData={setData} resources={availableResources} methods={methods} data={data} session={session}/>
                                )
                                }
                            </div>
                        </div>
                    </div>
                )}
                {!searchMode && (<ReservationUserListing entries={userEntries}/>)}

            </div>
        </div>
        </div>
    );
};



export {ReservationSearch};


