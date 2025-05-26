import React, {useEffect} from 'react';
import {useFormContext} from 'react-hook-form';
import {useQuery} from "@tanstack/react-query";
import {Chip, Select, SelectItem} from "@nextui-org/react";
import {firstLetterUppercase} from "@/global";

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
                         validates,
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
        enabled: !awaiting && options !== null,
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

        // Si la valeur est nulle, on réinitialise aussi le watchedValue
        if (value === null) {
            setWatchedValue(null);
        }

        const updateInheritance = () => {
            const inheritanceDomain = watch('domains');
            const inheritanceCategory = watch('category');
            if (eyesOn !== null && (inheritanceDomain !== undefined || inheritanceCategory !== undefined)) {
                const domainName = inheritanceDomain?.[eyesOn]?.name;
                const categoryName = inheritanceCategory?.[eyesOn]?.name;
                const newValue = domainName || categoryName;
                setWatchedValue(newValue);
            }
        };

        updateInheritance();
        const subscription = watch((value, {name: fieldName}) => {
            if (fieldName === 'domains' || fieldName === 'category') {
                updateInheritance();
            }
        });

        return () => subscription.unsubscribe();
    }, [value, defaultValue, setValue, name, resolvedOptions, eyesOn, watch]);
    const handleChange = (selectedValue) => {
        if (!selectedValue || selectedValue.size === 0) {
            onReset();
            setWatchedValue(null);
            setSelectedKey(null);
            setValue(name, null);
            return;
        }

        const selectedId = Array.from(selectedValue)[0];
        const selectedOption = resolvedOptions?.find(option => option.id.toString() === selectedId);

        if (selectedOption) {
            setValue(name, selectedOption);
            setSelectedKey(selectedId);
        } else {
            onReset();
            setWatchedValue(null);
            setSelectedKey(null);
            setValue(name, null);
        }
    };

    const findMissingId = (options, value) => {
        if (!options || !value) return null;
        const option = options.find(opt => opt.name === value);
        return option?.id?.toString();
    };

    useEffect(() => {
        if (defaultValue && !isLoading && resolvedOptions) {
            const newKey = typeof defaultValue === "string"
                ? findMissingId(resolvedOptions, defaultValue)
                : defaultValue?.id?.toString();
            if (newKey) {
                setSelectedKey(newKey);
                const option = resolvedOptions.find(opt => opt.id.toString() === newKey);
                if (option) {
                    setValue(name, option);
                }
            }
        }
    }, [defaultValue, resolvedOptions, isLoading, name, setValue]);

    return (
        <div className="my-2 w-full">
                <Select
                    size="sm"
                    isDisabled={awaiting}
                    isRequired={isRequired}
                    id={name}
                    name={name}
                    aria-label={label}
                    role="combobox"
                    aria-controls={`${name}-listbox`}
                    aria-haspopup="listbox"
                    label={
                    <span className="p-0.5">
                        <span className="mr-2 text-content-primary dark:text-dark-content-primary">{label}</span>
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
                    selectedKeys={selectedKey ? new Set([selectedKey]) : new Set([])}
                    isLoading={isLoading}
                    hideEmptyContent={true}
                    onSelectionChange={handleChange}
                    placeholder={eyesOn !== null && watchedValue !== undefined ?
                        <span
                            className="italic text-content-secondary dark:text-dark-content-secondary">{watchedValue} par héritage</span> : resolvedOptions?.length ? placeholder : "Aucune donnée"}
                    classNames={{
                        label: "text-content-primary dark:text-dark-content-primary",
                        value: "text-content-primary dark:text-dark-content-primary",
                        description: "text-content-secondary dark:text-dark-content-secondary",
                        trigger: "text-content-primary dark:text-dark-content-primary",
                        placeholder: "text-content-secondary dark:text-dark-content-secondary",
                        listbox: "text-content-primary dark:text-dark-content-primary"
                    }}
                    disabledKeys={validates ? Object.keys(validates).filter(key => !validates[key]) : []}
                >
                    {(option) => (
                        <SelectItem
                            variant='bordered'
                            color="default"
                            aria-label={option?.name || option}
                            key={option?.id}
                            value={option?.id?.toString()}
                            textValue={option?.name || option}
                            description={option?.description && option?.description}
                        >
                            {option?.name && firstLetterUppercase(option.name) || option}
                            {" "}
                            {option?.surname && firstLetterUppercase(option.surname)}
                        </SelectItem>
                    )}
                </Select>
            {errors[name] && <p className="error-message text-red-600 mt-2">{errors[name].message}</p>}
        </div>
    );
};





export default SelectField;
