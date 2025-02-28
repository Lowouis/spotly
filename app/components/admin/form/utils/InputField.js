'use client';
import React from "react";
import {Input} from "@nextui-org/input";
import {useFormContext} from "react-hook-form";
import { useEffect } from "react";


export default function InputField({ required, type, label, name, value, placeholder }) {
    const { register, watch, setValue, formState: { errors } } = useFormContext(); // Connexion au formulaire global
    useEffect(() => {
        if (value !== undefined) {
            setValue(name, value);
        }
        console.log(value);
    }, [value, name, setValue]);

    console.log(watch(name), "  ---  ", value);

    return (
        <div className="form-group">
            <label htmlFor={name}>{label}</label>
            <Input
                id={name}
                type={type}
                isInvalid={!!errors[name]}
                placeholder={placeholder}
                isRequired={required}
                errorMessage={errors[name]?.message}
                {...register(name, { required })}
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
