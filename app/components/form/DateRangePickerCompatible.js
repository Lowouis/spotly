import {getLocalTimeZone, parseZonedDateTime, today} from "@internationalized/date";
import {DateRangePicker} from "@nextui-org/date-picker";
import {useFormContext} from "react-hook-form";
import {I18nProvider} from 'react-aria';
import React from "react";
import {useDisclosure} from "@nextui-org/react";

export default function DateRangePickerCompatible({name, label, disabled=false, alternative=false}) {
    const {setValue, watch, register, formState: { errors } } = useFormContext();
    const value = watch(name);
    const handleChange = (value) => {
        setValue(name, value);
    };


    return (
        <I18nProvider locale="fr-FR">
            {!alternative ? (
                <DateRangePicker

                visibleMonths={2}
                size="lg"
                id={name}
                aria-label={label}
                variant="bordered"
                name={name}
                isRequired
                hideTimeZone
                className="my-2 w-full"
                minValue={today(getLocalTimeZone())}
                color="primary"
                isDisabled={disabled}
                onChange={handleChange}
                zone={getLocalTimeZone()}
                radius="lg"
                aria-labelledby={name}
                />) : (
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
                    color="primary"
                    size="lg"
                    hourCycle={24}
                    granularity="hour"
                    hideTimeZone={false}
                    isRequired={true}
                    isDisabled={false}
                    variant="bordered"
                    aria-labelledby={name}
                />
            )}

        </I18nProvider>
    )
}