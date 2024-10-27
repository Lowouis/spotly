import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger, getKeyValue,
    Table, TableBody, TableCell,
    TableColumn,
    TableHeader, TableRow
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import React from "react";
import {EllipsisVerticalIcon} from "@heroicons/react/24/outline";
import {ArrowsRightLeftIcon, PlusCircleIcon} from "@heroicons/react/24/solid";


export default function ItemsOnTable({items, name}) {
    console.log(items)
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
                            {items && Object.keys(items[0]).map((item, index) => (
                                <DropdownItem key={index}>{item}</DropdownItem>
                            ))}
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
                        >
                            {items && Object.keys(items[0]).map((item, index) => (
                                <DropdownItem key={index}>{item}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Button size="md" color="primary" endContent={<PlusCircleIcon height={24} width={24}/>}>Ajouter</Button>
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
                                    {item}
                                </TableColumn>
                            ))}
                            <TableColumn key="actions" align="right">
                                actions
                            </TableColumn>

                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.key}>
                                    {Object.keys(item).map((key) => (
                                        <TableCell key={key}>
                                            {item[key]}
                                        </TableCell>
                                    ))}
                                    <TableCell key={`actions-${item.key}`}>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button isIconOnly size="sm" variant="light">
                                                    <EllipsisVerticalIcon width={24} height={24}/>
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu>
                                                <DropdownItem>View</DropdownItem>
                                                <DropdownItem>Edit</DropdownItem>
                                                <DropdownItem color="danger">Delete</DropdownItem>
                                            </DropdownMenu>
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