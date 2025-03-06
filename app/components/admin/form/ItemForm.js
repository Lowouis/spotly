import {FormProvider, useForm} from "react-hook-form";
import {Button, ModalBody, ModalFooter} from "@nextui-org/react";
import React from "react";
import InputField from "@/app/components/admin/form/utils/InputField";
import BooleanInput from "@/app/components/admin/form/utils/BooleanInput";
import SelectField from "@/app/components/form/SelectField";
import {addToast, ToastProvider} from "@heroui/toast";


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
            addToast({
                title: `${action === "create" ? "Création" : "Modification"} d'un élément`,
                description: `L'élément a été ${action === "create" ? "créé" : "modifié"} avec succès.`,
                timeout: 5000,
                variant: "solid",
                radius: "sm",
                color: "success"
            });
            onClose();
        } catch (error) {
            addToast({
                title: `Erreur lors de la ${action === "create" ? "création" : "modification"} de l'élément`,
                description: error.message,
                timeout: 5000,
                variant: "solid",
                radius: "sm",
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
                    <Button color="danger" variant="light" onPress={onClose}>
                        Annuler
                    </Button>
                    <Button 
                        color="primary" 
                        type="submit" 
                        variant="light"
                     >
                        {action === "create" ? "Créer" : "Modifier"}
                    </Button>
                </ModalFooter>
            </form>
        </FormProvider>
    );
}