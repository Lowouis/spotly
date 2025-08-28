import React from "react";
import {Radio, RadioGroup} from "@heroui/react";
import {Controller, useFormContext} from "react-hook-form";

export default function StatusInput({label, name, required, defaultValue}) {
    const {control, formState: {errors: formErrors}} = useFormContext();

    // Déterminer la valeur par défaut
    const getDefaultValue = () => {
        if (defaultValue) {
            return defaultValue;
        }
        return "UNAVAILABLE";
    };

    return (
        <div className="form-group">
            <Controller
                name={name}
                control={control}
                defaultValue={getDefaultValue()}
                rules={{required: required ? "Ce champ est requis" : false}}
                render={({field}) => (
                    <RadioGroup
                        id={name}
                        label={<span className="text-neutral-900 dark:text-neutral-100">{label}</span>}
                        className={`form-input ${formErrors[name] ? 'input-error' : ''}`}
                        value={field.value}
                        color="default"
                        onChange={field.onChange}
                    >
                        <Radio
                            value="AVAILABLE"
                            description={<span className="text-neutral-500 dark:text-neutral-400">La ressource est disponible pour les réservations</span>}
                        >
                            Disponible
                        </Radio>
                        <Radio
                            value="UNAVAILABLE"
                            description={<span
                                className="text-neutral-500 dark:text-neutral-400">La ressource n&apos;est pas disponible pour les réservations</span>}
                        >
                            Non disponible
                        </Radio>
                    </RadioGroup>
                )}
            />
            {formErrors[name] && (
                <p className="text-red-500 error-message text-sm mx-2">
                    {formErrors[name]?.message || "Ce champ est requis"}
                </p>
            )}
        </div>
    );
}
