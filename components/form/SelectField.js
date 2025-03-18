import React, {useEffect} from 'react';
import { useFormContext } from 'react-hook-form';
import { useQuery } from "@tanstack/react-query";
import { Select, SelectItem } from "@nextui-org/select";
import {firstLetterUppercase} from "@/global";
import {Chip} from "@nextui-org/react";
const SelectField = ({
                        name,
                        label,
                        options,
                        awaiting = false,
                        variant = "bordered",
                        labelPlacement="inside",
                        isRequired = true,
                        onReset = () => {},
                        defaultValue,
                         placeholder = "Aucun",
                         eyesOn = null

                     }) => {
    const { setValue, watch, formState: { errors }, register } = useFormContext();
    const value = watch(name);
    const [selectedKey, setSelectedKey] = React.useState(null);
    const { data: resolvedOptions, isLoading, error } = useQuery({
        queryKey: [name, options],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/${options}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        enabled: !awaiting,
    });
    const [watchedValue, setWatchedValue] = React.useState(null);

    useEffect(() => {
        if(value === null && defaultValue && resolvedOptions !== undefined){
            if(typeof defaultValue === "string"){
                const objectFromOptions = resolvedOptions.find(option => option.name === defaultValue);
                setValue(name, objectFromOptions);
            } else {
                setValue(name, defaultValue);
            }
        }
        const inheritanceDomain = watch('domains');
        const inheritanceCategory = watch('category');
        if (eyesOn !== null && (inheritanceDomain !== undefined || inheritanceCategory !== undefined)) {
            const domainName = inheritanceDomain?.[eyesOn]?.name;
            const categoryName = inheritanceCategory?.[eyesOn]?.name;
            console.log(domainName, categoryName);
            setWatchedValue(domainName || categoryName);
        }
    }, [value, defaultValue, setValue, name, resolvedOptions, eyesOn, watchedValue, watch]);
    const handleChange = (selectedValue) => {
        const selectedId = Array.from(selectedValue)[0];
        const selectedOption = resolvedOptions.find(option => option.id.toString() === selectedId);
        selectedOption?.id !== value?.id ? setValue(name, selectedOption) : onReset();
        setSelectedKey(selectedId);
    };

    const findMissingId = (options, value) => {
        return options && options?.find(option => option.name === value).id.toString();
    };
    useEffect(() => {
        if (defaultValue && !isLoading) {
            const newKey = typeof defaultValue === "string"
                ? findMissingId(resolvedOptions, defaultValue)
                : defaultValue?.id?.toString();
            setSelectedKey(newKey);
        }
    }, [defaultValue, resolvedOptions, isLoading]);


    return (
        <div className="my-2 w-full">
                <Select
                    errorMessage={"Ce champs est obligatoire."}
                    size="sm"
                    isDisabled={awaiting}
                    isRequired={isRequired}
                    id={name}
                    name={name}
                    label={
                    <span className="p-0.5">
                        <span className="mr-2">{label}</span>
                        <Chip
                            radius={'full'}
                            variant={'flat'}
                            size="sm"
                            color={resolvedOptions && resolvedOptions?.length !== 0 ? "primary" : "danger"}
                        >{resolvedOptions?.length ? resolvedOptions.length : 0}</Chip>

                    </span>
                    }
                    variant={variant}
                    labelPlacement={labelPlacement}
                    items={resolvedOptions || []}
                    selectedKeys={[selectedKey]}
                    isLoading={isLoading}
                    hideEmptyContent={true}
                    onSelectionChange={(selected) => handleChange(selected)}
                    placeholder={eyesOn !== null && watchedValue !== undefined ?
                        <span className="italic">{watchedValue} par héritage</span> : placeholder}
                >
                    {(option) => {
                        return (
                            <SelectItem
                                color="primary"
                                aria-label={option?.name || option}
                                key={option?.id}
                                value={value}
                                textValue={option?.name || option}
                                description={option?.description && option?.description}
                            >
                                {option?.name && firstLetterUppercase(option.name) || option}
                                {" "}
                                {option?.surname && firstLetterUppercase(option.surname)}
                            </SelectItem>
                        )
                    }
                    }

            </Select>
            {errors[name] && <p className="error-message text-red-600 mt-2">{errors[name].message}</p>}
        </div>
    );
};





export default SelectField;
