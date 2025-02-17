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
                        onReset = () => {},
                        defaultValue,
                     }) => {
    const { setValue, watch, formState: { errors }, register } = useFormContext();
    const value = watch(name) !== null ? watch(name) : defaultValue?.id ? defaultValue.id : defaultValue;
    console.log("VALUE (FOR " + name + ") : ", value);
    const { data: optionsFetched, isLoading } = useQuery({
        queryKey: ['options', options],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/${options}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        enabled: typeof options === "string", 
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
    console.log("RO : ", resolvedOptions)
    return (
        <div className="text-slate-800 my-2 w-full">
            {!isLoading &&
                <Select
                    size="sm"
                    isDisabled={disabled || isLoading}
                    isRequired={isRequired}
                    id={name}
                    name={name}
                    label={label}
                    variant={variant}
                    labelPlacement={labelPlacement}
                    items={resolvedOptions || []}
                    defaultSelectedKeys={[value]}
                >
                    {(option) => {
                        return (
                            <SelectItem
                                color="primary"
                                className="text-black"
                                aria-label={option?.name || option}
                                key={option?.id ?? option}
                                value={option?.key ?? option?.id}
                                onPress={() =>handleChange(option)}
                                textValue={option?.name || option}
                                description={option?.description && option?.description}
                            >
                                {option?.name || option}
                                {" "}
                                {option?.surname}
                            </SelectItem>
                        )

                    }
                    }

            </Select>
            }
            {errors[name] && <p className="error-message text-red-600 mt-2">{errors[name].message}</p>}
        </div>
    );
};

export default SelectField;
