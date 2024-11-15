import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger, getKeyValue,
    Table, TableBody, TableCell,
    TableColumn,
    TableHeader, TableRow, useDisclosure
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import React from "react";
import {EllipsisVerticalIcon} from "@heroicons/react/24/outline";
import {ArrowsRightLeftIcon, EyeIcon, PencilIcon, PlusCircleIcon, TrashIcon} from "@heroicons/react/24/solid";
import * as yup from "yup";
import AddItem from "@/app/components/admin/communs/AddItem";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import ItemRow from "@/app/components/admin/communs/ActionMenu";
import ActionMenu from "@/app/components/admin/communs/ActionMenu";

const domainSchema = yup.object().shape({
    name: yup.string().required(),
    code: yup.string().optional(),
    address: yup.string(),
    street_number: yup.string(),
    country: yup.string(),
    city: yup.string(),
    zip: yup.string(),
    phone: yup.string(),
});

const categorySchema = yup.object().shape({
    name: yup.string().required(),
    description: yup.string().optional(),
    comment: yup.string(),
    });

const cleanedFields = (fields) => {
    return fields.filter(field => field !== 'id' && field !== 'createdAt' && field !== 'updatedAt');
}


export default function ItemsOnTable({items, name}) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const methods = useForm({
        resolver: yupResolver(categorySchema),
        mode: 'onSubmit',
    });
    return (
        <div className="mx-5">
            <div className="flex flex-row">
                <h1 className="text-2xl p-2 my-3 font-bold w-1/2">{name}</h1>
                <div className="w-1/2 flex flex-row justify-end items-center space-x-4">
                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                variant="bordered"
                                className="capitalize"
                                startContent={<ArrowsRightLeftIcon height={24} width={24}/>}
                            >
                                Trier par
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="sortBy"
                            variant="flat"
                            closeOnSelect={false}
                            disallowEmptySelection
                            selectionMode="multiple"
                        >
                            {items && Object.keys(items[0]).map((item, index) => {
                                if(typeof item !== 'object') {
                                   <DropdownItem key={index}>{item}</DropdownItem>
                                }
                            })}
                        </DropdownMenu>
                    </Dropdown>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button
                                variant="bordered"
                                className="capitalize"
                                startContent={<ArrowsRightLeftIcon height={24} width={24}/>}
                            >
                                Colonnes
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="showColumns"
                            variant="flat"
                            closeOnSelect={false}
                            disallowEmptySelection
                            selectionMode="multiple"
                            selectedKeys={items && Object.keys(items[0])}
                        >
                            {items && Object.keys(items[0]).map((item, index) => (
                                typeof item !== "object" && <DropdownItem key={index}>{item}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Button size="md" color="primary" onPress={onOpen} endContent={<PlusCircleIcon height={24} width={24}/>}>Ajouter</Button>
                    {items && <AddItem isOpen={isOpen} onOpenChange={onOpenChange} schema={domainSchema} methods={methods} fields={items?.length > 0 && cleanedFields(Object.keys(items[0]))}/>}
                </div>
            </div>
            {
                items ?

                    (<Table
                        aria-label="Rows actions table example with dynamic content"
                        selectionMode="multiple"
                        selectionBehavior="toggle"
                        shadow="none"
                    >
                        <TableHeader>
                            {Object.keys(items[0]).map((item, index) => (
                                <TableColumn key={index} align="left">
                                    {typeof item !== "object" && item}
                                </TableColumn>
                            ))}
                            <TableColumn key="actions" align="right">
                                actions
                            </TableColumn>

                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={index}>
                                    {Object.keys(item).map((key) => (
                                        <TableCell key={key}>
                                            {item[key]}
                                        </TableCell>
                                    ))}
                                    <TableCell key={`actions-${item.key}`}>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button isIconOnly size="sm" variant="light" >
                                                    <EllipsisVerticalIcon width={24} height={24}/>
                                                </Button>
                                            </DropdownTrigger>
                                            <ActionMenu values={item} />
                                        </Dropdown>
                                    </TableCell>
                                </TableRow>
                            ))}


                        </TableBody>
                    </Table>) : (
                        <div className="flex justify-center items-center">
                            <p>Aucun éléments à afficher</p>
                        </div>
                    )}

        </div>
    )
        ;
}