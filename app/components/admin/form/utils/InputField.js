import React from "react";
import { Input } from "@nextui-org/input";
import { useFormContext } from "react-hook-form";

export default function InputField({ required, type, label, name, placeholder, dependsOn }) {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="form-group">
            <label htmlFor={name}> {label} </label>
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