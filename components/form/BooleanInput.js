import React, {useEffect, useState} from "react";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {Controller, useFormContext} from "react-hook-form";


export default function BooleanInput({label, name, value, required, dependsOn = null}) {
    const {watch, setValue, control, formState: {errors: formErrors}} = useFormContext();

    const [disabled, setDisabled] = useState(false);

    const domainValue = watch(dependsOn[0]) !== undefined ? watch(dependsOn[0]) : null;
    const categoryValue = watch(dependsOn[1]) !== undefined ? watch(dependsOn[1]) : null;
    const owner = watch(dependsOn[2]) !== undefined ? watch(dependsOn[2]) : null;
    // useEffect pour activer/désactiver le champ en fonction de dependsO
    useEffect(() => {
        // Si dependsOn est null, le champ est toujours activé
        if (dependsOn === null) {
            setDisabled(false);
            return;
        }

        // Vérifier si au moins un propriétaire existe (domaine, catégorie ou ressource)
        const hasOwner = (
            (domainValue?.owner !== null && domainValue?.owner !== undefined) ||
            (categoryValue?.owner !== null && categoryValue?.owner !== undefined) ||
            (owner !== null && owner !== undefined)
        );
        setDisabled(!hasOwner);

        if (!hasOwner) {
            // Si le champ est désactivé, on le met à false
            setValue(name, "0");
        }

    }, [dependsOn, domainValue, categoryValue, setValue, name, owner]);


    return (
        <div className="form-group">
            <Controller
                name={name}
                control={control}
                defaultValue={value !== undefined ? String(value) === "1" || value === true ? "1" : "0" : "0"}
                rules={{required: required ? "Ce champ est requis" : false}}
                render={({field}) => (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <fieldset className={`form-input space-y-3 ${formErrors[name] ? 'input-error' : ''}`} disabled={disabled}>
                                    <legend className="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</legend>
                                    <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-3">
                                        <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                                            <RadioGroupItem value="1" />
                                            <span>
                                                <span className="block font-medium text-foreground">Oui</span>
                                                <span className="text-neutral-500 dark:text-neutral-400">Un modérateur doit valider la réservation pour cette ressource</span>
                                            </span>
                                        </label>
                                        <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                                            <RadioGroupItem value="0" />
                                            <span>
                                                <span className="block font-medium text-foreground">Non</span>
                                                <span className="text-neutral-500 dark:text-neutral-400">La ressource est en libre disposition</span>
                                            </span>
                                        </label>
                                    </RadioGroup>
                                </fieldset>
                            </TooltipTrigger>
                            {disabled && <TooltipContent>Pour modifier cette valeur, veuillez vérifier que la catégorie ou le site possède un propriétaire.</TooltipContent>}
                        </Tooltip>
                    </TooltipProvider>
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
