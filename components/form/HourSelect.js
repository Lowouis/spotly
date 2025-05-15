import React from "react";
import {Select, SelectItem} from "@heroui/select";

export default function HourSelect({label, defaultValue, name, onChange, isDisabled, isInvalid, minValue, maxValue}) {
    const hours = Array.from({length: 24}, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return {key: hour, label: `${hour}h`};
    });
    // Generate disabled keys based on minValue and maxValue
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
        <Select
            isRequired
            defaultSelectedKeys={[defaultValue]}
            variant="bordered"
            label={label}
            items={hours}
            size="sm"
            name={name}
            isDisabled={isDisabled}
            isInvalid={isInvalid}
            disabledKeys={disabledKeys}
            onChange={onChange}
            classNames={{
                value: "text-content-primary dark:text-dark-content-primary font-medium",
                trigger: "bg-transparent text-content-primary dark:text-dark-content-primary",
                listbox: "text-content-primary dark:text-dark-content-primary",
                placeholder: "text-content-secondary dark:text-dark-content-secondary"
            }}
        >
            {(hour) => (
                <SelectItem key={hour.key} value={hour.key}>
                    {hour.label}
                </SelectItem>
            )}
        </Select>
    );
}