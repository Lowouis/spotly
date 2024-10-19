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
                id={name}
                name={name}
                isRequired
                hideTimeZone
                className="text-black mb-2 parent-class-black"
                minValue={today(getLocalTimeZone())}
                color="primary"
                isDisabled={false}
                labelPlacement="outside"
                label="Choisir une date"
                onChange={handleChange}
                zone={getLocalTimeZone()}
            />
        </I18nProvider>
    )
}