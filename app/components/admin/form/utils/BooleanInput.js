import React from "react";
import {Radio, RadioGroup} from "@nextui-org/react";
import {useFormContext} from "react-hook-form";


export default function BooleanInput({  label, name, value: defaultValue }) {
    const { watch, setValue, formState: { errors: formErrors } } = useFormContext();
    const value = watch(name) !== "" ? watch(name) : defaultValue ? "1" : "0";
    const handleChange = (selectedValue) => {
        setValue(name, selectedValue.target.value);
    };

    console.log("BOOLEAN (FOR " + name + ") : ", value);
    return (
        <div className="form-group">
            <RadioGroup
                id={name}
                label={label}
                onChange={handleChange}
                className={`form-input ${formErrors[name] ? 'input-error' : ''}`}
                value={value}
            >
                <Radio
                    value={"1"}
                    description="Un modérateur doit valider la réservation pour cette ressource"
                >
                    Oui
                </Radio>
                <Radio
                    value={"0"}
                    description="La ressource est en libre disposition"
                >
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
