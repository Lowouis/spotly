import React from "react";
import {Input} from "@nextui-org/input";
import {useFormContext} from "react-hook-form";



export default function InputField({ required, type, label, name, value }) {
    const { register, setValue, formState: { errors } } = useFormContext(); // Connexion au formulaire global
    if (value) setValue(name, value);
    return (
        <div className="form-group">
            <label htmlFor={name}>{label}</label>
            <Input
                id={name}
                type={type}
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
