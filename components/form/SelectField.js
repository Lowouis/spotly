'use client';
import React, {useEffect} from 'react';
import {useFormContext} from 'react-hook-form';
import {useQuery} from "@tanstack/react-query";
import {Chip, Select, SelectItem} from "@heroui/react";
import {firstLetterUppercase} from "@/global";

const defaultClassNames = {
    label: "text-content-primary dark:text-dark-content-primary",
    value: "text-content-primary dark:text-dark-content-primary",
    description: "text-content-secondary dark:text-dark-content-secondary",
    trigger: "text-content-primary dark:text-dark-content-primary",
    placeholder: "text-content-secondary dark:text-dark-content-secondary",
    listbox: "text-content-primary dark:text-dark-content-primary"
};

const SelectField = ({
                        name,
                        label,
                        options,
                        awaiting = false,
                         variant = "fade",
                        labelPlacement="inside",
                        isRequired = true,
                        onReset = () => {},
                        defaultValue,
                         validates,
                         placeholder = "Aucun",
                         eyesOn = null,
                         classNames = {}
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
        // On ne réinjecte le defaultValue QUE si c'est le tout premier render (pas après un reset manuel)
        if (value === undefined && defaultValue && resolvedOptions !== undefined) {
            if (typeof defaultValue === "string") {
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
            console.log('[SelectField] updateInheritance', {inheritanceDomain, inheritanceCategory, eyesOn});
            if (eyesOn !== null && (inheritanceDomain !== undefined || inheritanceCategory !== undefined)) {
                const domainName = inheritanceDomain?.[eyesOn]?.name;
                const categoryName = inheritanceCategory?.[eyesOn]?.name;
                const newValue = domainName || categoryName;
                setWatchedValue(newValue);
            }
        };

        updateInheritance();
        const subscription = watch((value, {name: fieldName}) => {
            console.log('[SelectField] watch subscription', {value, fieldName});
            if (fieldName === 'domains' || fieldName === 'category') {
                updateInheritance();
            }
        });

        return () => subscription.unsubscribe();
    }, [defaultValue, setValue, name, resolvedOptions, eyesOn, watch, value]);
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

    // On force les ids des options en string (NextUI attend des strings)
    const safeOptions = resolvedOptions ? resolvedOptions.map(opt => ({...opt, id: opt.id?.toString()})) : [];
    // selectedKeys : undefined si aucune sélection
    const safeSelectedKeys = selectedKey ? new Set([selectedKey]) : undefined;

 
    return (
        <div className="my-2 w-full">
                <Select
                    autoComplete='off'
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
                            variant={"flat"}
                            size="sm"
                            color={safeOptions && safeOptions.length !== 0 ? "primary" : "danger"}
                        >{safeOptions.length ? safeOptions.length : 0}</Chip>
                    </span>
                    }
                    variant={variant}
                    labelPlacement={labelPlacement}
                    items={safeOptions}
                    selectedKeys={selectedKey ? new Set([selectedKey]) : new Set([])}
                    isLoading={isLoading}
                    hideEmptyContent={true}
                    onSelectionChange={handleChange}
                    placeholder={eyesOn !== null && watchedValue !== undefined ?
                        <span
                            className="italic text-neutral-500 dark:text-neutral-400">{watchedValue} par héritage</span> : safeOptions.length ? placeholder : "Aucune donnée"}
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
                    disabledKeys={validates ? Object.keys(validates).filter(key => !validates[key]) : []}
                >
                    {(option) => (
                        <SelectItem
                            variant='bordered'
                            color="default"
                            aria-label={
                                typeof option?.distinguishedName === 'string' ? option.distinguishedName
                                    : typeof option?.name === 'string' ? option.name
                                        : (option?.id || '')
                            }
                            key={option?.id}
                            value={option?.id}
                            textValue={
                                typeof option?.distinguishedName === 'string' ? option.distinguishedName
                                    : typeof option?.name === 'string' ? option.name
                                        : (option?.id || '')
                            }
                            description={
                                typeof option?.description === 'string'
                                    ? <span
                                        className="text-neutral-400 dark:text-neutral-400 text-sm">{option.description}</span>
                                    : ''
                            }
                            className="py-3 px-4 min-h-[48px] flex items-center"
                        >
                        <span className="font-semibold">
                          {(typeof option?.distinguishedName === 'string' ? option.distinguishedName
                              : typeof option?.name === 'string' ? option.name
                                  : (option?.id || ''))}
                        </span>
                            {option?.surname && (
                                <span className="ml-2 text-neutral-400 dark:text-neutral-400">
                            {firstLetterUppercase(option.surname)}
                          </span>
                            )}
                        </SelectItem>
                    )}
                </Select>
            {errors[name] && <p className="error-message text-red-600 mt-2">{errors[name].message}</p>}
        </div>
    );
};





export default SelectField;
