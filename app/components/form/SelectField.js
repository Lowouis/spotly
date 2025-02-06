import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from "@tanstack/react-query";
import { Select, SelectSection, SelectItem } from "@nextui-org/select";

const SelectField = ({
                         name,
                         label,
                         options,
                         variant = "bordered",
                         labelPlacement="inside",
                         disabled = false,
                         isRequired = true,
                         object = false,
                         onReset = () => {}
                     }) => {
    const { setValue, watch, formState: { errors } } = useFormContext();
    const value = watch(name);

    // Fetch options dynamically if `options` is a string (indicating an API endpoint)
    const { data: optionsFetched, isLoading } = useQuery({
        queryKey: ['options', options], // Use `options` as part of the query key
        queryFn: async () => {
            const response = await fetch(`${process.env.API_ENDPOINT}/api/${options}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        enabled: typeof options === "string", // Fetch only if `options` is a string
    });

    // Use either fetched options or local options
    const resolvedOptions = typeof options === "string" ? optionsFetched : options;

    const handleChange = (selectedValue) => {
        if (object) {
            selectedValue.id !== value?.id ? setValue(name, selectedValue) : onReset();
        } else {
            selectedValue !== value ? setValue(name, selectedValue) : onReset();
        }
    };

    return (
        <div className="text-slate-800 my-2 w-full">
            <Select
                size="sm"
                isDisabled={disabled || isLoading}
                isRequired={isRequired}
                id={name}
                name={name}
                label={label}
                variant={variant}
                labelPlacement={labelPlacement}
            >
                <SelectSection label={label}>
                    {!isLoading && resolvedOptions && resolvedOptions.map((option, index) => (
                        <SelectItem
                            color="primary"
                            className="text-black"
                            key={index}
                            value={object ? option : option.id}
                            onClick={() => handleChange(object ? option : option.id)}
                        >
                            {option.name}
                        </SelectItem>
                    ))}
                </SelectSection>
            </Select>
            {errors[name] && <p className="error-message text-red-600 mt-2">{errors[name].message}</p>}
        </div>
    );
};

export default SelectField;
