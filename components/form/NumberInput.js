import React from "react";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {useFormContext} from "react-hook-form";


export default function BooleanInput({  label, name }) {
    const {  watch, setValue, formState: { errors: formErrors } } = useFormContext();
    const value = watch(name);

    return (
        <div className="form-group">
            <fieldset className={`form-input space-y-3 ${formErrors[name] ? 'input-error' : ''}`}>
                <legend className="mb-2 text-sm font-medium text-foreground">{label}</legend>
                <RadioGroup value={value || "0"} onValueChange={(nextValue) => setValue(name, nextValue)} className="gap-3">
                    <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                        <RadioGroupItem value="1" />
                        <span>
                            <span className="block font-medium text-foreground">Oui</span>
                            <span className="text-muted-foreground">Un modérateur doit valider la réservation pour cette ressource</span>
                        </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                        <RadioGroupItem value="0" />
                        <span>
                            <span className="block font-medium text-foreground">Non</span>
                            <span className="text-muted-foreground">La ressource est en libre disposition</span>
                        </span>
                    </label>
                </RadioGroup>
            </fieldset>
            {formErrors[name] && (
                <p className="text-red-500 error-message text-sm mx-2">
                    {formErrors[name]?.message || "Ce champ est requis"}
                </p>
            )}
        </div>
    );
}
