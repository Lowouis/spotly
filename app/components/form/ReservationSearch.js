import {FormProvider, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SelectField from './SelectField';
import React, {useEffect, useState} from "react";
import {Time} from "@internationalized/date";
import {Skeleton, Switch} from "@nextui-org/react";
import TimeInputCompatible from "@/app/components/form/timeInputCompatible";
import DateRangePickerCompatible from "@/app/components/form/DateRangePickerCompatible";
import AvailableTable from "@/app/components/tables/AvailableTable";
import {AlternativeMenu} from "@/app/components/menu";
import {MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {Button} from "@nextui-org/button";
import ReservationUserListing from "@/app/components/reservations/Listings";

const schemaFirstPart = yup.object().shape({
    site: yup.string().required('Vous devez choisir un site'),
    category: yup.string().required('Vous devez choisir une ressource'),
    ressource: yup.string().optional().default(null).nullable(),
    date: yup.object().required('Vous devez choisir une date'),
    allday: yup.object().optional(),
    starthour: yup.object().shape({
        hour: yup.number().min(8, 'L\'heure de début doit être au minimum 8h').max(19, 'L\'heure de début doit être au maximum 19h').required()
    }).required('Vous devez choisir une heure de début'),
    endhour: yup.object().shape({
        hour: yup.number().min(8, 'L\'heure de fin doit être au minimum 8h').max(19, 'L\'heure de fin doit être au maximum 19h').required()
    }).required('Vous devez choisir une heure de fin')
}).test('is-valid-time-range', 'L\'heure de début doit être inférieure à l\'heure de fin', function (value) {
    const { date, starthour, endhour } = value;
    if (date && date.start && date.end && starthour && endhour) {
        const isSameDay = date.start.year === date.end.year &&
            date.start.month === date.end.month &&
            date.start.day === date.end.day;
        if (isSameDay) {
            return starthour.hour < endhour.hour;
        }
    }
    return true;
});

export function anyResourceAvailable(entries){


    return (
        <div>
            <Skeleton isLoaded={true} className="rounded-lg w-full">
                <div className="rounded-lg bg-green-100 p-2 flex justify-center items-center flex-col">
                    <div className="text-xl">
                        Ressources disponible
                    </div>
                </div>
            </Skeleton>
            <Skeleton isLoaded={true} className="rounded-lg w-full">
                <div className="rounded-lg p-2 flex justify-center items-center flex-col w-full">
                    <AvailableTable entries={entries} />
                </div>
            </Skeleton>
        </div>
    )
}

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
    const [summary, setSummary] = useState(false);
    const [isLoaded, setIsLoaded] = useState(true);


    const {watch, setValue} = methods;
    const watchSite = watch('site');
    const watchCategory = watch('category');

    const [daySwitch, setDaySwitch] = useState(watch('allday') ?? false);

    const handleDaySwitch = (e) => {
        if(!daySwitch){
            setValue('starthour', new Time(8));
            setValue('endhour', new Time(19));
        } else {
            setValue('starthour', null);
            setValue('endhour', null);
        }
        setDaySwitch(!daySwitch);
    }

    const handleSearchMode = (tab) => {
        setSearchMode(tab==='search');
    }
    useEffect(() => {
        if(isSubmitted && matchingEntries){

            const cpAvailableResources = [...resources];
            const filteredResources = cpAvailableResources.filter(resource =>
                !matchingEntries?.some(entry => data.ressource === null ? (resource.id === parseInt(data.ressource) && entry.resourceId === resource.id) : entry.resourceId !== resource.id));
            console.log("AFTER FILTER : ",filteredResources);
            setAvailableResources(filteredResources || null);
            setIsSubmitted(false);
        }
    }, [data, isSubmitted, matchingEntries, resources, setAvailableResources, setIsSubmitted]);


    useEffect(() => {

        const fetchMatchingEntries = () => {
            if(isSubmitted && data){

                const startDate = new Date();
                startDate.setFullYear(data.date.start.year);
                startDate.setMonth(data.date.start.month-1);
                startDate.setDate(data.date.start.day);
                startDate.setTime(data.starthour.hour);
                const endDate = new Date();
                endDate.setFullYear(data.date.end.year);
                endDate.setMonth(data.date.end.month-1);
                endDate.setDate(data.date.end.day);
                startDate.setTime(data.endhour.hour);
                //
                fetch(`http://localhost:3000/api/entry/?siteId=${data.site}&categoryId=${data.category}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}${data.ressource !== undefined ? '&resourceId='+data.ressource : ''}`)
                    .then(response => response.text())
                    .then(text => {
                        try {
                            const data = JSON.parse(text);
                            setMatchingEntries(data);
                        } catch (error) {
                            console.error('Failed to parse JSON:', error);
                            console.error('Response text:', text);
                        }
                    })
                    .catch(error => {
                            console.error('Fetch error:', error);
                        }
                    );
            }

        }

        const fetchDomains = () => {
            fetch('http://localhost:3000/api/domains')
                .then(response => response.text())
                .then(text => {
                    try {
                        const data = JSON.parse(text);
                        setDomains(data);
                    } catch (error) {
                        console.error('Failed to parse JSON:', error);
                        console.error('Response text:', text);
                    }
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                });
        }
        const fetchCategories = () => {
            fetch('http://localhost:3000/api/categories')
                .then(response => response.text())
                .then(text => {
                    try {
                        const data = JSON.parse(text);
                        setCategories(data);
                    } catch (error) {
                        console.error('Failed to parse JSON:', error);
                        console.error('Response text:', text);
                    }
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                });
        }
        const fetchResources = ()=> {
            if(watchCategory && watchSite){
                fetch(`http://localhost:3000/api/resources/?categoryId=${watchCategory}&domainId=${watchSite}`)
                    .then(response => response.text()) // Read the response as text
                    .then(text => {
                        try {
                            const data = JSON.parse(text); // Try to parse the text as JSON
                            setResources(data);
                        } catch (error) {
                            console.error('Failed to parse JSON:', error);
                            console.error('Response text:', text); // Log the response text for debugging
                        }
                    })
                    .catch(error => {
                        console.error('Fetch error:', error);
                    });
            } else {
                setResources(null);
            }
        }

        fetchDomains();
        fetchCategories();
        fetchResources();
        fetchMatchingEntries();
    }, [setDomains, setCategories, setResources, watchSite, watchCategory, watch, data, isSubmitted, availableResources, setMatchingEntries]);

    

    const onSubmit = (data) => {
        setData(data);
        setIsSubmitted(true);
    };
    if (!methods) {
        return <p>Error: Form could not be initialized</p>;
    }
    return (
        <div className="py-4 bg-gradient-to-b from-neutral-50 ">
        <AlternativeMenu user={session?.user} handleSearchMode={handleSearchMode}/>
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
                                        {/* ISSUE : ON RESET IT DOESN'T RESET STATE OF DATA SO IT'S NOT REFRESHING IN CASE WE DON'T WANT TO SEARCH FOR ALL RESSOURCES   */}
                                        <SelectField
                                            name="ressource"
                                            label="Ressources"
                                            options={resources}
                                            disabled={!resources}
                                            isRequired={false}
                                            className=""
                                        />
                                        <DateRangePickerCompatible name={"date"}/>
                                    </div>
                                    <div className="flex flex-row space-x-2 w-full">
                                        <div className="flex flex-col justify-center items-center">
                                            <span className="text-xs">Journée</span>
                                            <Switch size="sm" variant="bordered" name="allday" id="allday" color="primary" className="mb-2"
                                                    onClick={(e) => {
                                                        handleDaySwitch()
                                                    }}></Switch>

                                        </div>

                                        <TimeInputCompatible hidden={daySwitch}
                                                             name="starthour"/>
                                        <TimeInputCompatible hidden={daySwitch}
                                                             name="endhour"
                                                             clockColor="red"/>

                                        <div className="flex flex-col justify-center items-center">
                                            <span className="text-xs">Récursif</span>
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
                                    <AvailableTable resources={availableResources} methods={methods} setSummary={setSummary} data={data}/>
                                )}
                                {(!isSubmitted && !availableResources) ?? (<AvailableTable resources={availableResources}/>)}
                            </div>
                        </div>
                    </div>
                )}
                {!searchMode && (<ReservationUserListing user={session?.user}/>)}

            </div>
        </div>
        </div>
    );
};


const ReservationSideElements = ({data}) => {
    const [isLoaded, setIsLoaded] = useState(true);
    const [availableSlots, setAvailableSlots] = useState();
    const toggleLoad = () => {
        setIsLoaded(!isLoaded);
    };

    return (
        <div className="flex flex-col w-full ml-3">

        </div>

    );

    /*return (

        <div className="flex flex-col w-full ml-3">
            <Card className="h-full w-full space-y-5 p-2" radius="lg" shadow="sm">
                <Skeleton isLoaded={isLoaded} className="rounded-lg w-full h-full">
                    <div className="rounded-lg text-green-700 p-2 flex justify-center items-center flex-col h-full">
                        <div className="text-xl">
                            Ressources disponible
                        </div>
                        <Button color="success">Confirmer ma reservation</Button>
                    </div>
                </Skeleton>
            </Card>
        </div>

    );*/


    /*return (
        <div className="flex flex-col w-full ml-3">
            <Card className="h-full w-full space-y-5 p-2" radius="lg" shadow="sm">
                <Skeleton isLoaded={isLoaded} className="rounded-lg w-full">
                    <div className="rounded-lg bg-green-100 p-2 flex justify-center items-center flex-col">
                        <div className="text-xl">
                            Ressources disponible
                        </div>
                    </div>

                </Skeleton>
                <Skeleton isLoaded={isLoaded} className="rounded-lg w-full">
                    <div className="rounded-lg p-2 flex justify-center items-center flex-col">
                        <div className="">
                            Choisissez le ressource de votre choix
                        </div>
                        <AvailableTable />
                    </div>

                </Skeleton>
            </Card>
        </div>
    )*/

    /*return (
        <div className="flex flex-col w-full ml-3">
            <Card className="h-full w-full space-y-5 p-2" radius="lg" shadow="sm">
                <Skeleton isLoaded={isLoaded} className="rounded-lg w-full">
                    <div className="rounded-lg bg-red-100 p-2 flex justify-center items-center flex-col">
                        <div className="text-xl">
                            Cette ressource n’est pas disponible avec ces horaires.
                        </div>
                        <div className="text-sm">
                            Essayer de reserver sur une autre période ou de choisir d’autres ressources
                        </div>
                    </div>

                </Skeleton>
                <Skeleton isLoaded={isLoaded} className="rounded-lg w-full">
                    <div className="rounded-lg bg-red-50 p-2 flex justify-center items-center flex-col">
                        <div className="">
                            Prochain crénaux disponible de cette ressource avec cette durée à partir du :
                        </div>
                        <div className=" font-bold">
                            28 septembre 2024 à 12h00
                        </div>
                    </div>

                </Skeleton>
                <Skeleton isLoaded={isLoaded} className="rounded-lg w-full">
                    <div className="rounded-lg p-2 flex justify-center items-center flex-col">
                        <Button color="success" >Voir les prochaines disponibilités</Button>
                    </div>

                </Skeleton>
            </Card>
        </div>
    );*/
    /*return (
        <div className="flex flex-col w-full ml-3">
            <Card className="h-full w-full space-y-5 p-2" radius="lg" shadow="sm">
                <Skeleton isLoaded={isLoaded} className="rounded-lg w-full">
                    <div className="rounded-lg bg-red-100 p-2 flex justify-center items-center flex-col">
                        <div className="text-xl">
                            Aucune ressource disponible avec ces horraires.
                        </div>
                        <div className="text-sm">
                            Essayez de réserver sur une autre période.
                        </div>
                    </div>

                </Skeleton>
                <div className="space-y-2 h-full">
                    <Skeleton isLoaded={isLoaded} className="rounded-lg">
                        <div className="w-full p-1">
                            <UnavailableTable />
                        </div>
                    </Skeleton>

                </div>
            </Card>
        </div>
    );*/
}




export {ReservationSearch, ReservationSideElements};


