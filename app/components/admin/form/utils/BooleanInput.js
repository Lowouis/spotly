import React from "react";
import {Radio, RadioGroup} from "@nextui-org/react";
import {useFormContext, Controller} from "react-hook-form";

export default function BooleanInput({label, name, required}) {
    const {control, formState: {errors: formErrors}} = useFormContext();

    return (
        <div className="form-group">
            <Controller
                name={name}
                control={control}
                rules={{required: required ? "Ce champ est requis" : false}}
                render={({field}) => (
                    <RadioGroup
                        id={name}
                        label={label}
                        className={`form-input ${formErrors[name] ? 'input-error' : ''}`}
                        value={field.value}
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