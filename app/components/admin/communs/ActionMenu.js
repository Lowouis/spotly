import {PencilIcon, TrashIcon} from "@heroicons/react/24/solid";
import React, {useState} from "react";
import {

    DropdownItem,
    DropdownMenu,
    useDisclosure
} from "@nextui-org/react";
import ActionOnItem from "@/app/components/admin/communs/ActionOnItem";



export default function ActionMenu({values}) {
    const {isOpen, OnOpen, OnChange} = useDisclosure();
    const [action, setAction] = useState("");

    return (
        <>
            <DropdownMenu>
                <DropdownItem onPress={setAction("change") && OnOpen} startContent={<PencilIcon height={24} width={24} />} color="primary" variant="bordered">
                    Modifier
                </DropdownItem>
                <DropdownItem onPress={setAction("delete") && OnOpen} startContent={<TrashIcon height={24} width={24} />} variant="flat" color="danger">
                        Supprimer
                </DropdownItem>

            </DropdownMenu>
            <ActionOnItem values={values} action={action} isOpen={isOpen} onOpenChange={OnChange} />
        </>

    )
}