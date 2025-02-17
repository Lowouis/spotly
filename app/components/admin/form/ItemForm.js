import {FormProvider, useForm} from "react-hook-form";
import {Button, ModalBody, ModalFooter} from "@nextui-org/react";
import React from "react";
import InputField from "@/app/components/admin/form/utils/InputField";
import BooleanInput from "@/app/components/admin/form/utils/BooleanInput";
import SelectField from "@/app/components/form/SelectField";


export default function ItemForm({ onSubmit, onClose, action, fields, defaultValues }) {
    const methods = useForm({
        defaultValues: Object.fromEntries(
            fields.map(field => [field.name, field.type === 'object' ? null : ''])
        )
    });
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
                                            value={defaultValues ? defaultValues[field.name] : ""}
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
                                            value={defaultValues ? defaultValues[field.name] : null}
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
                                            defaultValue={defaultValues ? defaultValues[field.name] : ""}
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
                    <Button color="primary" type="submit" variant="light" onPress={onClose}>
                        {action === "create" ? "Créer" : "Modifier"}
                    </Button>
                </ModalFooter>
            </form>
        </FormProvider>
    );
}
