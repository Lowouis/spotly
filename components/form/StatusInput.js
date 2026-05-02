import React from "react";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
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
                    <fieldset className={`form-input space-y-3 ${formErrors[name] ? 'input-error' : ''}`}>
                        <legend className="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</legend>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-3">
                            <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                                <RadioGroupItem value="AVAILABLE" />
                                <span>
                                    <span className="block font-medium text-foreground">Disponible</span>
                                    <span className="text-neutral-500 dark:text-neutral-400">La ressource est disponible pour les réservations</span>
                                </span>
                            </label>
                            <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                                <RadioGroupItem value="UNAVAILABLE" />
                                <span>
                                    <span className="block font-medium text-foreground">Non disponible</span>
                                    <span className="text-neutral-500 dark:text-neutral-400">La ressource n&apos;est pas disponible pour les réservations</span>
                                </span>
                            </label>
                        </RadioGroup>
                    </fieldset>
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
