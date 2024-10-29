import {Button} from "@nextui-org/button";
import {PencilIcon, PlusCircleIcon, TrashIcon} from "@heroicons/react/24/solid";
import AddItem from "@/app/components/admin/communs/AddItem";
import React from "react";
import {

    DropdownItem,
    DropdownMenu,

    useDisclosure
} from "@nextui-org/react";



export default function ActionMenu({values}) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();


    return (
        <DropdownMenu>

            <DropdownItem onPress={onOpen} startContent={<PencilIcon height={24} width={24} />} color="primary" variant="bordered">Modifier</DropdownItem>
            <AddItem values={values} action="modifié" isOpen={isOpen} onOpenChange={onOpenChange} />
            <DropdownItem startContent={<TrashIcon height={24} width={24} />} variant="flat" color="danger">Supprimer</DropdownItem>
        </DropdownMenu>

    )
}