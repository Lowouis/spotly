
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SelectField from '../SelectField';
import SubmitButton from '../SubmitButton';
import {useEffect, useRef, useState} from "react";
import CheckoutField from "@/app/components/form/CheckoutFIeld";
import TimeSlot from "@/app/components/calendar/TimeSlot";
import {DateRangePicker} from "@nextui-org/date-picker";
import {getLocalTimeZone, parseDate, parseZonedDateTime, Time, today} from "@internationalized/date";
import {TimeInput} from "@nextui-org/react";
import {ValidationError} from "yup";

const schemaFirstPart = yup.object().shape({
    site: yup.string().required('Vous devez choisir un site'),
    category: yup.string().required('Vous devez choisir une ressource'),
    ressource: yup.string(),
    date: yup.date().min(new Date(), "La date doit être supérieur ou égale à celle d'aujourd'hui").required('Vous devez choisir une date'),
    starthour: yup.string().required('Vous devez choisir une heure de début'),
    endhour: yup.string().required('Vous devez choisir une heure de fin'),
});
//add later here when we get previous form data the day + min hours and max hours
const schemaSecondPart = yup.object().shape({
    duration: yup.number().required('Vous devez choisir une durée'),
    type: yup.string().required('Vous devez choisir un type de durée'),
    day: yup.boolean().optional(),
    slot: yup.date().required("Vous devez choisir un crenaux"),
    comment : yup.string().optional(),

});


const ReservationFormSecond = ({setStep}) => {
    const [dropdownButton, setDropdownButton] = useState(false);
    const [currentSlot, setCurrentSlot] = useState(null);
    const dropdownRef = useRef(null);
    const durations = [
        {value: 1, name: "1h"},
        {value: 2, name: "2h"},
        {value: 3, name: "3h"},
        {value: 4, name: "4h"},
        {value: 5, name: "5h"},
    ];
    const types = [
        {value: 1, name: "heure(s)"},
        {value: 2, name: "jour(s)"},
    ];

    const handleClickSlot = (slot) => {
        setCurrentSlot(slot);
    }

    const methods = useForm({
        resolver: yupResolver(schemaSecondPart),
        mode: 'onSubmit',
    });

    const onSubmit = (data) => {
        console.log(data);
    }
    if(!methods){
        return <p>Error: Form could not be initialized</p>;
    }

    return (
        <div>
            <FormProvider {...methods}>
                <div className="flex flex-row justify-start items-center">
                    <CheckoutField name={"day"} label={"Toute la journée"}/>
                    <div className="flex flex-row">
                        <SelectField name={"duration"} label={"Durée"} options={durations}/>
                        <SelectField name={"duration"} label={"Type"} options={types} />
                    </div>

                </div>
                <div>
                    <TimeSlot handleClickSlot={handleClickSlot} currentSlot={currentSlot} />
                </div>
                <SubmitButton label={"Je confirme ma réservation"}/>
            </FormProvider>

        </div>
    );
}

function ClockCircleLinearIcon(props) {
    return null;
}

const ReservationFormFirst = ({setStep}) => {
    const [domains, setDomains] = useState();
    const [categories, setCategories] = useState();
    const [resources, setResources] = useState();
    const [quantityOfResources, setQuantityOfResources] = useState(resources ? resources.length : 0);

    const methods = useForm({
        resolver: yupResolver(schemaFirstPart),
        mode: 'onSubmit',
    });


    const {watch} = methods;
    const watchSite = watch('site');
    const watchCategory = watch('category');

    useEffect(() => {
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
            console.log(watchCategory, watchSite);
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
}, [setDomains, setCategories, setResources, watchSite, watchCategory]);

    const onSubmit = (data) => {
        //setStep(2);
        console.log(data);
    };
    if (!methods) {
        return <p>Error: Form could not be initialized</p>;
    }
    return (
        <FormProvider {...methods}>
            <div className="h-7 p-2 my-5">
                <span className="text-sm text-slate-900"><span className="text-green-700 font-extrabold">{quantityOfResources} </span>ressources disponibles</span>
            </div>
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
                />

                <DateRangePicker
                    isRequired
                    hideTimeZone
                    className="text-black mb-2 parent-class-black"
                    minValue={today(getLocalTimeZone())}
                    defaultValue={{
                        start: today(getLocalTimeZone()),
                        end: today(getLocalTimeZone()),
                    }}
                    color="primary"
                    isDisabled={false}
                    labelPlacement="outside"
                    label="Choisir une date"
                />
                <TimeInput
                    startContent={(
                        <ClockCircleLinearIcon className="text-xl text-default-400 pointer-events-none flex-shrink-0" />
                    )}
                    required color="primary"
                    className="text-black mb-2 "
                    label="Heure de début"
                    defaultValue={new Time(8, 0)}
                    minValue={new Time(8)}
                    maxValue={new Time(19)}
                    hourCycle="h24"
                    validate={(value) => {
                        if(value.minute !== 0){
                            return new ValidationError("L'heure doit être pleine");
                        } else {
                            return true;
                        }
                    }}
                />
                <TimeInput
                    name
                    startContent={(
                        <ClockCircleLinearIcon className="text-xl text-default-400 pointer-events-none flex-shrink-0" />
                    )}
                    required
                    color="primary"
                    className="text-black"
                    label="Heure de fin"
                    defaultValue={new Time(9, 0)}
                    minValue={new Time(8)}
                    maxValue={new Time(19)}
                    hourCycle="h24"
                    validate={(value) => {
                        if(value.minute !== 0){
                            return new ValidationError("L'heure doit être pleine");
                        } else {
                            return true;
                        }
                    }}
                />

                {/*<DatePicker methods={methods}/>*/}
                <SubmitButton label="Je reserve"/>
            </form>
        </FormProvider>
    );
};


export {ReservationFormFirst, ReservationFormSecond};


