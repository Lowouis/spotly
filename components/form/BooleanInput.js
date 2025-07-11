import React, {useEffect, useState} from "react";
import {Radio, RadioGroup, Tooltip} from "@heroui/react";
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
                    <Tooltip showArrow isDisabled={!disabled}
                             content={"Pour modifier cette valeur, veuillez vérifié que la catégorie ou le site possède un propriétaire."}
                             color="warning">
                        <RadioGroup
                            id={name}
                            label={label}
                            isDisabled={disabled}
                            className={`form-input ${formErrors[name] ? 'input-error' : ''}`}
                            value={field.value}
                            color="default"
                            onChange={field.onChange}
                        >
                            <Radio
                                value="1"
                                description="Un modérateur doit valider la réservation pour cette ressource"
                            >
                                Oui
                            </Radio>
                            <Radio
                                value="0"
                                description="La ressource est en libre disposition"
                            >
                                Non
                            </Radio>
                        </RadioGroup>
                    </Tooltip>
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