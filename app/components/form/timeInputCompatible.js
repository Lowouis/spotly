import { Time } from "@internationalized/date";
import { ValidationError } from "yup";
import { TimeInput } from "@nextui-org/react";
import { useFormContext } from "react-hook-form";
import {hidden} from "next/dist/lib/picocolors";

export default function TimeInputCompatible({ name, label, hidden=false}) {
    const { setValue, watch, formState: { errors } } = useFormContext();
    const value = watch(name);
    const handleChange = (value) => {
        setValue(name, value);
    };

    return (
        <TimeInput
            isDisabled={hidden}
            granularity="hour"
            name={name}
            id={name}
            required
            color="primary"
            className="text-black mb-2"
            label={label}
            minValue={new Time(8)}
            maxValue={new Time(19)}
            hourCycle="h24"
            onChange={handleChange}
        />
    );
}