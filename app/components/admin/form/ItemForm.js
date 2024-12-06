import {FormProvider, useForm} from "react-hook-form";
import {Button, ModalBody, ModalFooter} from "@nextui-org/react";
import React from "react";
import InputField from "@/app/components/admin/form/utils/InputField";
import BooleanInput from "@/app/components/admin/form/utils/BooleanInput";
import SelectField from "@/app/components/form/SelectField";


export default function ItemForm({ onSubmit, onClose, action, fields }) {
    const methods = useForm();
    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                <ModalBody>
                    <div className="flex flex-col space-y-3">
                        {fields.map((field, index) => {
                            switch (field.type) {
                                case "text" :
                                    return (
                                        <InputField
                                            key={field.name || index}
                                            required={field.required}
                                            type={field.type}
                                            label={field.label}
                                            name={field.name}
                                            errors={methods?.errors}
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
                                            options={field.name} // Remplacez `field.name` par l'identifiant approprié si nécessaire
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
                    <Button color="primary" type="submit" onPress={onClose}>
                        {action === "create" ? "Créer" : "Modifier"}
                    </Button>
                </ModalFooter>
            </form>
        </FormProvider>
    );
}
