import React from "react";
import { Input } from "@nextui-org/input";
import { useFormContext } from "react-hook-form";
import {IoEyeOffOutline, IoEyeOutline} from "react-icons/io5";
import {Button} from "@nextui-org/button";

export default function InputField({required, type, label, name, placeholder, dependsOn, hidden = false}) {
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
                    required: dependsOn !== undefined ? false : required
                })}
                className={`form-input ${errors[name] ? 'input-error' : ''}`}
                variant="bordered"
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
            {errors[name] && (
                <p className="text-red-500 error-message text-sm mx-2">
                    {errors[name]?.message || 'Ce champ est requis'}
                </p>
            )}
        </div>
    );
}