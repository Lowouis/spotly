
import { TimeInput } from "@nextui-org/react";
import { useFormContext } from "react-hook-form";

import {ClockIcon} from "@heroicons/react/24/solid";
import {Time} from "@internationalized/date";

export default function TimeInputCompatible({ name, label, clockColor="blue",hidden=false}) {
    const { setValue, watch, formState: { errors } } = useFormContext();
    const value = watch(name);
    const handleChange = (value) => {
        setValue(name, value);
    };

    return (
        <div className=" my-2 w-full">
            <TimeInput
                startContent={(
                    <ClockIcon color={clockColor} width="24" height="24" />
                )}
                size="lg"
                isDisabled={hidden}
                granularity="hour"
                name={name}
                variant="bordered"
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
        </div>

    );
}