import React from "react";
import {Radio, RadioGroup} from "@nextui-org/react";
import {useFormContext} from "react-hook-form";


export default function BooleanInput({ required, label, name, errors }) {
    const { register, watch, setValue, formState: { errors: formErrors } } = useFormContext();
    const value = watch(name); // Suivre la valeur de l'input

    const handleChange = (selectedValue) => {
        console.log(selectedValue)
        setValue(name, selectedValue.target.value); // Met à jour la valeur dans le contexte du formulaire
    };

    return (
        <div className="form-group">
            <RadioGroup
                id={name}
                label={label}
                value={value || "0"} // Valeur par défaut
                onChange={handleChange} // Mise à jour lors du changement
                className={`form-input ${formErrors[name] ? 'input-error' : ''}`}
            >
                <Radio value="1" description="Un modérateur doit valider la réservation pour cette ressource">
                    Oui
                </Radio>
                <Radio value="0" description="La ressource est en libre disposition">
                    Non
                </Radio>
            </RadioGroup>
            {formErrors[name] && (
                <p className="text-red-500 error-message text-sm mx-2">
                    {formErrors[name]?.message || "Ce champ est requis"}
                </p>
            )}
        </div>
    );
}
