
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SelectField from './SelectField';
import SubmitButton from './SubmitButton';
import DatePicker from "@/app/components/DatePicker";
import {useEffect, useState} from "react";

const schema = yup.object().shape({
    site: yup.string().required('Vous devez choisir un site'),
    category: yup.string().required('Vous devez choisir une ressource'),
    ressource: yup.string(),
    date: yup.date().min(new Date(), "La date doit être supérieur ou égale à celle d'aujourd'hui").required('Vous devez choisir une date'),
});



const Form = () => {
    const [domains, setDomains ] = useState();
    const [categories, setCategories ] = useState();
    const [resources, setResources ] = useState();
    const [quantityOfResources, setQuantityOfResources ] = useState(resources ? resources.length : 0);

    const methods = useForm({
        resolver: yupResolver(schema),
        mode: 'onSubmit',
    });


    const { watch } = methods;
    const watchSite = watch('site');
    const watchCategory = watch('category');

    useEffect(() => {
        const fetchDomains = ()=> {
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
        const fetchCategories = ()=> {
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
}, [setDomains, setCategories, setResources, watchSite, watchCategory]);

    const onSubmit = (data) => {
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
                <DatePicker methods={methods}/>
                <SubmitButton label="Je reserve"/>
            </form>
        </FormProvider>
    );
};
export default Form;


