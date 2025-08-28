import React from "react";
import {Select, SelectItem} from "@heroui/select";

export default function HourSelect({
                                       label,
                                       defaultValue,
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
            selectedKeys={value ? [value] : []}
            label={label}
            items={hours}
            size="sm"
            name={name}
            isDisabled={isDisabled}
            isInvalid={isInvalid}
            disabledKeys={disabledKeys}
            onChange={onChange}
            classNames={{
                trigger: "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm",
                value: "text-neutral-900 dark:text-neutral-100 font-semibold",
                placeholder: "text-neutral-500 dark:text-neutral-400",
                listbox: "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-lg",
                popoverContent: "py-2",
                item: "py-3 px-4 min-h-[48px] flex items-center transition-colors duration-150 cursor-pointer",
                selectedItem: "bg-primary-700/20 dark:bg-primary-700/20 text-primary-400 dark:text-primary-300 font-bold",
                highlightedItem: "bg-neutral-100 dark:bg-neutral-800",
                label: "text-neutral-800 dark:text-neutral-200 font-semibold",
                description: "text-neutral-600 dark:text-neutral-400 text-sm"
            }}
        >
            {(hour) => (
                <SelectItem
                    key={hour.key}
                    value={hour.key}
                    textValue={hour.label}
                    className="py-3 px-4 min-h-[48px] flex items-center">
                    <span className="font-semibold">{hour.label}</span>
                </SelectItem>
            )}
        </Select>
    );
}