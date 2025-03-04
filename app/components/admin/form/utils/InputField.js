'use client';
import React, { useEffect } from "react";
import { Input } from "@nextui-org/input";
import { useFormContext } from "react-hook-form";

export default function InputField({ required, type, label, name, value, placeholder, dependsOn }) {
    const { register, watch, setValue, getValues, formState: { errors } } = useFormContext();

    useEffect(() => {
        // Ne définir la valeur que si elle est définie et différente de la valeur actuelle
        if (value !== undefined) {
            const currentValue = getValues(name);

            if (dependsOn !== undefined) {
                // Si la valeur actuelle n'est pas déjà null, la réinitialiser
                if (currentValue !== null) {
                    setValue(name, null);
                }
            } else if (currentValue !== value) {
                // Ne mettre à jour que si la valeur est différente
                setValue(name, value);
            }
        }
    }, [name, value, dependsOn, setValue, getValues]);

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
                {...register(name, {
                    required: dependsOn !== undefined ? false : required
                })}
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