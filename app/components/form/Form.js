import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import InputField from './InputField';
import SelectField from './SelectField';
import SubmitButton from './SubmitButton';
import DatePicker from "@/app/components/DatePicker";

const schema = yup.object().shape({
    site: yup.string().required('Vous devez choisir un site'),
    category: yup.string().required('Vous devez choisir une ressource'),
    ressource: yup.string(),
    date: yup.date().required('Vous devez choisir une date'),
});

const Form = () => {
    const methods = useForm({
        resolver: yupResolver(schema),
        mode: 'onSubmit',
    });

    if (!methods) {
        return <p>Error: Form could not be initialized</p>;
    }

    const onSubmit = (data) => {
        console.log(data);
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <SelectField
                    name="site"
                    label="Choisir un site"
                    options={[
                        { label: 'Caen', value: 'caen' },
                        { label: 'Paris', value: 'paris' },
                        { label: 'Other', value: 'other' },
                    ]}
                />
                <SelectField
                    name="category"
                    label="Choisir une catégorie"
                    options={[
                        { label: 'Ordinateur', value: '0' },
                        { label: 'Voiture', value: '1' },
                        { label: 'Salle', value: '2' },
                    ]}
                />
                <SelectField
                    name="ressource"
                    label="Toutes les ressources"
                    options={[
                        { label: 'Caen', value: 'caen' },
                        { label: 'Paris', value: 'paris' },
                        { label: 'Other', value: 'other' },
                    ]}
                />
                <DatePicker />
                <SubmitButton label="Je reserve" />
            </form>
        </FormProvider>
    );
};

export default Form;
