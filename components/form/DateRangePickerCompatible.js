import {getLocalTimeZone, today} from '@internationalized/date';
import {DateRangePicker} from "@heroui/date-picker";
import {useFormContext} from "react-hook-form";
import {I18nProvider} from 'react-aria';
import React from "react";

export default function DateRangePickerCompatible({name, label, disabled = false}) {
    const {setValue, watch, register, formState: { errors } } = useFormContext();
    const value = watch(name);

    const handleChange = (value) => {
        // Vérification que la valeur est valide avant de la définir
        if (value && value.start && value.end) {
            setValue(name, value);
        }
    };

    return (
        <I18nProvider locale="fr-FR">
            <DateRangePicker
                onChange={handleChange}
                zone={getLocalTimeZone()}
                minValue={today(getLocalTimeZone())}
                radius="lg"
                id={name}
                name={name}
                className="my-2 w-full"
                aria-label={label}
                labelPlacement="outside"
                color="default"
                size="lg"
                hideTimeZone={false}
                isRequired={true}
                visibleMonths={2}
                isRange={true}
                isDisabled={disabled}
                variant="bordered"
                aria-labelledby={name}
                value={value || {}} // Fournir une valeur par défaut vide
                errorMessage={errors[name]?.message}
                placeholder="Sélectionnez une plage de dates"
            />
        </I18nProvider>
    );
}