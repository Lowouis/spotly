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
                value: "dark:text-white text-black font-medium", // Rendre le texte plus foncé et plus gras
                trigger: "bg-transparent", // S'assurer que l'arrière-plan est blanc
                listbox: "text-black dark:text-white", // Assurer que le texte dans la liste déroulante est noir
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