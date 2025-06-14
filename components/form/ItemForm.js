import {FormProvider, useForm} from "react-hook-form";
import {Button, ModalBody, ModalFooter} from "@nextui-org/react";
import React from "react";
import InputField from "@/components/form/InputField";
import BooleanInput from "@/components/form/BooleanInput";
import SelectField from "@/components/form/SelectField";
import {addToast} from "@heroui/toast";


export default function ItemForm({ onSubmit, onClose, action, fields, defaultValues }) {
    const methods = useForm({
        type: "onSubmit",
        defaultValues: defaultValues
            ? fields.reduce((acc, field) => {
                acc[field.name] = defaultValues[field.name] !== undefined
                    ? (typeof defaultValues[field.name] === "boolean" ? (defaultValues[field.name] ? "1" : "0") : defaultValues[field.name] )
                    : field.type === 'object' ? null : '';
                return acc;
            }, {})
            : Object.fromEntries(
                fields.map(field => [field.name, field.type === 'object' ? null : ''])
            )
    });


    const handleSubmit = async (data) => {
        try {
            await onSubmit(data);
            onClose();
        } catch (error) {
            addToast({
                title: `Erreur lors de la ${action === "create" ? "création" : "modification"} de l'élément`,
                description: error.message,
                timeout: 5000,
                color: "danger"
            })
        }
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
                <ModalBody>
                    <div className="flex flex-col space-y-3">
                        {fields.map((field, index) => {
                            const rules = {
                                required : field.required ? `${field.label} est requis` : false
                            }
                            switch (field.type) {
                                case "text" :
                                    return (
                                        <InputField
                                            key={field.name || index}
                                            required={field.required}
                                            type={field.type}
                                            label={field.label}
                                            name={field.name}
                                            value={defaultValues ? defaultValues[field.name] : ""}
                                            dependsOn={defaultValues && field?.dependsOn !== undefined ? defaultValues[field.dependsOn] : undefined}                                            register={methods.register(field.name, rules)}
                                            placeholder={field.placeholder}
                                            hidden={field?.hidden && field.hidden}
                                            pattern={field?.pattern !== undefined ? field.pattern : null}
                                            patternMessage={field?.patternMessage !== undefined ? field.patternMessage : null}
                                        />
                                    );
                                case "number":
                                    return (
                                        <InputField
                                            key={field.name || index}
                                            required={field.required}
                                            type={field.type}
                                            label={field.label}
                                            name={field.name}
                                            errors={methods?.errors}
                                            value={defaultValues ? defaultValues[field.name] : ""}
                                        />
                                    );
                                case "boolean":
                                    return (
                                        <BooleanInput
                                            key={field.name || index}
                                            required={field.required}
                                            label={field.label}
                                            name={field.name}
                                            dependsOn={field?.dependsOn}
                                        />
                                    );
                                case "object":
                                    return (
                                        <SelectField
                                            key={field.name || index}
                                            isRequired={field.required}
                                            label={field.label}
                                            name={field.name}
                                            variant="solid"
                                            options={field.options}
                                            defaultValue={defaultValues ? defaultValues[field.name] : null}
                                            placeholder={field.placeholder}
                                            eyesOn={field.watchValue}
                                        />
                                    );
                                default:
                                    return (
                                        <div key={index} className="text-red-500">
                                            Champ non défini : {field.type}
                                        </div>
                                    );
                            }
                        })}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        color="default"
                        variant="light"
                        onPress={onClose}
                    >
                        Annuler
                    </Button>
                    <Button
                        color="default"
                        type="submit"
                        variant="flat"
                     >
                        {action === "create" ? "Créer" : "Modifier"}
                    </Button>
                </ModalFooter>
            </form>
        </FormProvider>
    );
}