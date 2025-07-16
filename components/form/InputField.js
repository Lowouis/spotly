import React from "react";
import {Input} from "@heroui/input";
import {useFormContext} from "react-hook-form";
import {IoEyeOffOutline, IoEyeOutline} from "react-icons/io5";
import {Button} from "@heroui/button";

export default function InputField({
                                       required,
                                       type,
                                       label,
                                       name,
                                       placeholder,
                                       dependsOn,
                                       pattern,
                                       patternMessage,
                                       hidden = false
                                   }) {
    const { register, formState: { errors } } = useFormContext();
    const [isVisible, setIsVisible] = React.useState(false);
    return (
        <div className="form-group">
            <Input
                id={name}
                label={label}
                labelPlacement="outside"
                type={hidden && !isVisible ? "password" : type}
                isDisabled={dependsOn !== undefined ? dependsOn : false}
                isInvalid={!!errors[name]}
                placeholder={placeholder}
                isRequired={dependsOn !== undefined ? dependsOn : required}
                errorMessage={errors[name]?.message}
                {...register(name, {
                    required: dependsOn !== undefined ? false : required,
                    pattern: pattern ? {
                        value: new RegExp(pattern),
                        message: patternMessage || 'Format invalide'
                    } : undefined
                })}
                className={`form-input ${errors[name] ? 'input-error' : ''}`}
                variant="bordered"
                classNames={{
                    inputWrapper: "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm",
                    input: "text-neutral-900 dark:text-neutral-100 font-semibold placeholder:text-neutral-500 dark:placeholder:text-neutral-400",
                    label: "text-neutral-800 dark:text-neutral-200 font-semibold",
                    errorMessage: "text-red-500 text-sm mt-1",
                }}
                endContent={
                    hidden &&
                    <Button className="scale-75" size="md" variant="faded" onPress={() => setIsVisible(!isVisible)}
                            isIconOnly radius="full">
                        {isVisible ? (
                            <IoEyeOutline size={25}/>
                        ) : (
                            <IoEyeOffOutline size={25}/>
                        )}
                    </Button>
                }
            />

        </div>
    );
}