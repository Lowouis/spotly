'use client';
import React, {useEffect} from 'react';
import {useFormContext} from 'react-hook-form';
import {useQuery} from "@tanstack/react-query";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {firstLetterUppercase} from "@/global";
import {cn} from "@/lib/utils";
import {SvgSpinners3DotsBounceIcon} from "@/components/icons/SvgSpinners3DotsBounce";

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
                          classNames = {},
                          inheritAttribute = "name",
                          onChange = () => {}
                      }) => {
    const { setValue, watch, formState: { errors }, register } = useFormContext();
    const value = watch(name);
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
            if (eyesOn !== null && (inheritanceDomain !== undefined || inheritanceCategory !== undefined)) {
                const domainName = inheritanceDomain?.[eyesOn]?.[inheritAttribute];
                const categoryName = inheritanceCategory?.[eyesOn]?.[inheritAttribute];
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
    }, [defaultValue, setValue, name, resolvedOptions, eyesOn, watch, value, inheritAttribute]);
    const handleChange = (selectedValue) => {
        if (!selectedValue) {
            onReset();
            setWatchedValue(null);
            setValue(name, null);
            return;
        }

        const selectedId = selectedValue;
        const selectedOption = resolvedOptions?.find(option => option.id.toString() === selectedId);

        if (selectedOption) {
            setValue(name, selectedOption);
            onChange(selectedOption);
        } else {
            onReset();
            setWatchedValue(null);
            setValue(name, null);
        }
    };

    const findMissingId = (options, value) => {
        if (!options || !value) return null;
        const normalizedValue = value.toString();
        const option = options.find(opt =>
            opt.id?.toString() === normalizedValue ||
            opt.name === value ||
            opt.distinguishedName === value
        );
        return option?.id?.toString();
    };

    useEffect(() => {
        if (defaultValue && !isLoading && resolvedOptions) {
            const newKey = typeof defaultValue === "string" || typeof defaultValue === "number"
                ? findMissingId(resolvedOptions, defaultValue)
                : defaultValue?.id?.toString();
            if (newKey) {
                const option = resolvedOptions.find(opt => opt.id.toString() === newKey);
                if (option) {
                    setValue(name, option);
                }
            }
        }
    }, [defaultValue, resolvedOptions, isLoading, name, setValue]);

    // On force les ids des options en string (NextUI attend des strings)
    const safeOptions = resolvedOptions ? resolvedOptions.map(opt => ({...opt, id: opt.id?.toString()})) : [];
    const selectedKey = resolvedOptions
        ? (typeof value === "string" || typeof value === "number" ? findMissingId(resolvedOptions, value) : value?.id?.toString())
        : null;
    return (
        <div className="my-2 w-full space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label htmlFor={name} className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {labelPlacement === "inside" ? null : label}{labelPlacement === "inside" ? label : ""}
                </label>
                <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    isLoading ? "bg-muted text-muted-foreground" : safeOptions.length ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"
                )}>
                    {isLoading ? <SvgSpinners3DotsBounceIcon size={18} aria-label="Chargement des choix" /> : safeOptions.length}
                </span>
            </div>
            <Select value={selectedKey || ""} onValueChange={handleChange} disabled={awaiting || isLoading || options === null} required={isRequired}>
                <SelectTrigger id={name} name={name} aria-label={label} className={cn("h-11 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm", classNames.trigger)}>
                    <SelectValue placeholder={isLoading ? "Chargement..." : eyesOn !== null && watchedValue !== undefined ? `${watchedValue} par héritage` : safeOptions.length ? placeholder : "Aucune donnée"}/>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-neutral-700 rounded-lg shadow-lg">
                    {safeOptions.map((option, index) => {
                        const disabled = validates ? validates[index] === false || validates[option.id] === false : false;
                        const text = typeof option?.distinguishedName === 'string' ? option.distinguishedName
                            : typeof option?.name === 'string' ? option.name
                                : (option?.id || '');

                        return (
                        <SelectItem
                            disabled={disabled}
                            aria-label={text}
                            key={option?.id}
                            textValue={text}
                            value={option?.id}
                            className="py-3 px-4 min-h-[48px]"
                        >
                            <span className="font-semibold">{text}</span>
                            {option?.surname && (
                                <span className="ml-2 text-neutral-400 dark:text-neutral-400">
                            {firstLetterUppercase(option.surname)}
                          </span>
                            )}
                            {option?.description && <span className="block text-xs text-neutral-500 dark:text-neutral-400">{option.description}</span>}
                        </SelectItem>
                    )})}
                </SelectContent>
            </Select>
            {errors[name] && <p className="error-message text-red-600 mt-2">{errors[name].message}</p>}
        </div>
    );
};





export default SelectField;
