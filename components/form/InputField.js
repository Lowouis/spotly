import React from "react";
import {useFormContext} from "react-hook-form";
import {IoEyeOffOutline, IoEyeOutline} from "react-icons/io5";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {cn} from "@/lib/utils";

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
    const error = errors[name]?.message;

    return (
        <div className="form-group space-y-2">
            {label && (
                <Label htmlFor={name} className="text-neutral-800 dark:text-neutral-200 font-semibold">
                    {label}{required && dependsOn === undefined ? " *" : ""}
                </Label>
            )}
            <div className="relative">
                <Input
                    id={name}
                    type={hidden && !isVisible ? "password" : type}
                    disabled={dependsOn !== undefined ? dependsOn : false}
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${name}-error` : undefined}
                    {...register(name, {
                        required: dependsOn !== undefined ? false : required,
                        pattern: pattern ? {
                            value: new RegExp(pattern),
                            message: patternMessage || 'Format invalide'
                        } : undefined
                    })}
                    className={cn(
                        "form-input bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-semibold placeholder:text-neutral-500 dark:placeholder:text-neutral-400 border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm",
                        hidden && "pr-12",
                        error && "input-error border-red-500 focus-visible:ring-red-500"
                    )}
                    required={dependsOn !== undefined ? dependsOn : required}
                />
                {hidden && (
                    <Button
                        type="button"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsVisible(!isVisible)}
                        aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                        {isVisible ? <IoEyeOutline size={18}/> : <IoEyeOffOutline size={18}/>}
                    </Button>
                )}
            </div>
            {error && <p id={`${name}-error`} className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
}
