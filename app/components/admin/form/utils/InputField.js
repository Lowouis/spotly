'use client';
import React, { useEffect, useRef } from "react";
import { Input } from "@nextui-org/input";
import { useFormContext } from "react-hook-form";

export default function InputField({ required, type, label, name, value, placeholder, dependsOn }) {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const initialRenderRef = useRef(true);

    // Only set initial values once on mount
    useEffect(() => {
        if (initialRenderRef.current && value !== undefined) {
            if (dependsOn !== undefined) {
                setValue(name, null);
            } else {
                setValue(name, value);
            }
            initialRenderRef.current = false;
        }
    }, [name, value, dependsOn, setValue]);

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