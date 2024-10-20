
import {useForm, FormProvider, useFormContext} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SelectField from '../SelectField';
import SubmitButton from '../SubmitButton';
import {useEffect, useRef, useState} from "react";
import CheckoutField from "@/app/components/form/CheckoutFIeld";
import TimeSlot from "@/app/components/calendar/TimeSlot";
import {DateRangePicker} from "@nextui-org/date-picker";
import {getLocalTimeZone, parseDate, parseZonedDateTime, Time, today} from "@internationalized/date";
import {Card, CardBody, Chip, Skeleton, TimeInput} from "@nextui-org/react";
import {ValidationError} from "yup";
import TimeInputCompatible from "@/app/components/form/timeInputCompatible";
import {Button} from "@nextui-org/button";
import DateRangePickerCompatible from "@/app/components/form/DateRangePickerCompatible";
import UnavailableTable from "@/app/components/tables/UnavailableTable";
import  {Switch} from "@nextui-org/react";
import AvailableTable from "@/app/components/tables/AvailableTable";
import Title from "@/app/components/utils/title";

const schemaFirstPart = yup.object().shape({
    site: yup.string().required('Vous devez choisir un site'),
    category: yup.string().required('Vous devez choisir une ressource'),
    ressource: yup.string().optional(),
    date: yup.object().required('Vous devez choisir une date'),
    allday: yup.object().optional(),
    starthour: yup.object().required('Vous devez choisir une heure de début'),
    endhour: yup.object().required('Vous devez choisir une heure de fin'),
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
                    <AvailableTable entries={entries}/>
                </div>
            </Skeleton>
        </div>
    )
}

const ReservationForm = ({setStep}) => {

    const [domains, setDomains] = useState();
    const [categories, setCategories] = useState();
    const [resources, setResources] = useState();
    const [availableResources, setAvailableResources] = useState();
    const [matchingEntries, setMatchingEntries] = useState();
    const [data, setData] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const methods = useForm({
        resolver: yupResolver(schemaFirstPart),
        mode: 'onSubmit',
    });
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
    const filterResourcesByEntriesMatching = (entries) => {
        // make a copy of the resources
        console.log(entries);
        const cpAvailableResources = [...resources];
        const filteredResources = cpAvailableResources.filter(resource =>
            !entries?.some(entry => entry.resourceId === resource.id)
        );
        console.log(filteredResources);
        setAvailableResources(filteredResources);
    }
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
                fetch(`http://localhost:3000/api/entry/?siteId=${data.site}&categoryId=${data.category}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
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
        filterResourcesByEntriesMatching(matchingEntries);
    };
    if (!methods) {
        return <p>Error: Form could not be initialized</p>;
    }
    return (
        <div className="w-2/3 flex flex-col">
            <Title  title="Réserver" />
            <div className="flex flex-row">
                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)}>
                        <SelectField
                            name="site"
                            label="Choisir un site"
                            options={domains}
                        />
                        <SelectField
                            name="category"
                            label="Choisir une catégorie"
                            options={categories}
                        />
                        <SelectField
                            name="ressource"
                            label="Toutes les ressources"
                            options={resources}
                            disabled={!resources}
                            isRequired={false}
                            className="mb-2"
                        />
                        <DateRangePickerCompatible name={"date"}/>
                        <Switch size="sm" name="allday" id="allday" color="primary" className="mb-2" onClick={(e) => {
                            handleDaySwitch()
                        }}>Toute la journée</Switch>
                        <TimeInputCompatible hidden={daySwitch} label={"Heure de début"} name="starthour"/>
                        <TimeInputCompatible hidden={daySwitch} label={"Heure de fin"} name="endhour"/>


                        <SubmitButton label="Consulter les disponibilités"/>
                    </form>
                </FormProvider>
                <div className="flex flex-col justify-center items-center mx-auto w-full ml-3">
                    <Card className="h-full w-full space-y-5 p-2" radius="lg" shadow="sm">
                        <Skeleton isLoaded={isLoaded} className="rounded-lg w-full">
                            <div className="rounded-lg bg-green-100 p-2 flex justify-center items-center flex-col">
                                <div className="text-xl">
                                    Ressources disponible
                                </div>
                            </div>
                        </Skeleton>
                        <Skeleton isLoaded={isLoaded} className="rounded-lg w-full">
                            <div className="rounded-lg p-2 flex justify-center items-center flex-col w-full">
                                <div className="">
                                    Choisissez le ressource de votre choix
                                </div>
                                {(isSubmitted && availableResources) ?? (<AvailableTable resources={availableResources}/>)}
                                {(!isSubmitted && !availableResources) ?? (<AvailableTable resources={availableResources}/>)}
                            </div>
                        </Skeleton>
                    </Card>
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


export {ReservationForm, ReservationSideElements};


