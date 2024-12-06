import React from "react";
import {Input} from "@nextui-org/input";
import {useFormContext} from "react-hook-form";



export default function InputField({ required, type, label, name }) {
    const { register, formState: { errors } } = useFormContext(); // Connexion au formulaire global

    return (
        <div className="form-group">
            <label htmlFor={name}>{label}</label>
            <Input
                id={name}
                type={type}
                {...register(name, { required })}
                className={`form-input ${errors[name] ? 'input-error' : ''}`}
            />
            {errors[name] && (
                <p className="text-red-500 error-message text-sm mx-2">
                    {errors[name]?.message || 'Ce champ est requis'}
                </p>
            )}
        </div>
    );
}
