import React from "react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

export default function HourSelect({
                                       label,
                                       value,
                                       name,
                                       onChange,
                                       isDisabled,
                                       isInvalid,
                                       minValue,
                                       maxValue
                                   }) {
    const hours = Array.from({length: 24}, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return {key: hour, label: `${hour}h`};
    });

    const disabledKeys = hours
        .filter(hour => {
            const hourNum = parseInt(hour.key);
            if (name === "endTime" && minValue) {
                return hourNum <= parseInt(minValue);
            } else if (name === "startTime" && maxValue) {
                return hourNum >= parseInt(maxValue);
            }
            return false;
        })
        .map(hour => hour.key);

    return (
        <div className="my-2 flex flex-col gap-2">
            <label htmlFor={name} className="flex h-5 items-center text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
                {label}
            </label>
            <Select
                required
                value={value || ""}
                disabled={isDisabled}
                onValueChange={(newValue) => {
                    if (newValue === value) return;
                    onChange({target: {name, value: newValue}});
                }}
            >
                <SelectTrigger
                    id={name}
                    name={name}
                    aria-invalid={isInvalid}
                    className="h-11 rounded-lg border-neutral-300 bg-white text-sm leading-none text-neutral-900 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                >
                    <SelectValue placeholder="Heure"/>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 rounded-lg shadow-lg">
                    {hours.map((hour) => (
                        <SelectItem
                            disabled={disabledKeys.includes(hour.key)}
                            key={hour.key}
                            value={hour.key}
                            className="py-3 px-4 min-h-[48px] flex items-center"
                        >
                            <span className="font-semibold">{hour.label}</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
