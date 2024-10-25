import {getLocalTimeZone, today} from "@internationalized/date";
import {DateRangePicker} from "@nextui-org/date-picker";
import {useFormContext} from "react-hook-form";
import {I18nProvider} from 'react-aria';

export default function DateRangePickerCompatible({name, label, disabled=false}) {
    const {setValue, watch, register, formState: { errors } } = useFormContext();
    const value = watch(name);
    const handleChange = (value) => {
        setValue(name, value);
    };


    return (
        <I18nProvider locale="fr-FR">
            <DateRangePicker
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
                radius="lg"/>
        </I18nProvider>
    )
}