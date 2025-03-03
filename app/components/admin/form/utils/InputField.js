'use client';
import React from "react";
import {Input} from "@nextui-org/input";
import {useFormContext} from "react-hook-form";


export default function InputField({ required, type, label, name, value, placeholder, dependsOn }) {
    const { register, watch, setValue, formState: { errors } } = useFormContext(); // Connexion au formulaire global

    if (value !== undefined) {
        if(dependsOn !== undefined){
            setValue(name, null);
        } else {
            setValue(name, value);
        }
    }



    return (
        <div className="form-group">
            <label htmlFor={name}>{label}</label>
            <Input
                id={name}
                type={type}
                isDisabled={dependsOn !== undefined ? dependsOn : false}
                isInvalid={!!errors[name]}
                placeholder={placeholder}
                isRequired={dependsOn !== undefined ? dependsOn : required}
                errorMessage={errors[name]?.message}
                {...register(name, { required : dependsOn !== undefined ? false : required })}
                className={`form-input ${errors[name] ? 'input-error' : ''}`}
                variant="bordered"
            />
            {errors[name] && (
                <p className="text-red-500 error-message text-sm mx-2">
                    {errors[name]?.message || 'Ce champ est requis'}
                </p>
            )}
        </div>
    );
}
