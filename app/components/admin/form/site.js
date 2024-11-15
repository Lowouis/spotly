import {Input} from "@nextui-org/input";
import * as yup from "yup";
import {Controller, FormProvider, useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import {Button, ModalBody, ModalFooter} from "@nextui-org/react";
import prisma from "@/prismaconf/init";
import  { User } from '@prisma/client'
import React from "react";
import InputField from "@/app/components/admin/form/utils/InputField";



export default function SiteForm({onSubmit, defaultValues, onClose, action}){

    const DomainsFields = [
        { required:true, name: 'name', type: 'text', label: 'Nom' },
        { required:true, name: 'code', type: 'number', label: 'Code' },
        { required:true, name: 'country', type: 'text', label: 'Pays' },
        { required:true, name: 'city', type: 'text', label: 'Ville' },
        { required:true, name: 'street_number', type: 'number', label: 'N°' },
        { required:true, name: 'address', type: 'text', label: 'Adresse' },
        { required:true, name: 'zip', type: 'number', label: 'Code Postal' },
        { required:true, name: 'phone', type: 'number', label: 'Téléphone' },
    ];
    const { register, handleSubmit, watch, formState: { errors } }
        = useForm();



        return (
            <>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <ModalBody>
                        <div className="flex flex-col space-y-3">
                            {DomainsFields.map((field, index) => (
                                field.type === 'text' || field.type === 'number' ? (
                                        <InputField
                                            key={index}
                                            register={register}
                                            required={field.required}
                                            type={field.type}
                                            errors={errors}
                                            label={field.label}

                                        />
                                    ) : (
                                            <>
                                            plus tard
                                            </>
                                    )


                            )
                            )}

                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="danger" variant="light" onPress={onClose}>
                        Annuler
                        </Button>
                        <Button color="primary" type="submit">
                        {action==="créer" ? "Créer" : "Modifier" }
                        </Button>
                    </ModalFooter>
                </form>
            </>

    );
}