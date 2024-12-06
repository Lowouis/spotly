import {
    Chip,
    Divider,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger, Skeleton, Snippet,
    Table, TableBody, TableCell,
    TableColumn,
    TableHeader, TableRow, Tooltip, useDisclosure
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import React, {useState} from "react";
import {PlusCircleIcon, TrashIcon} from "@heroicons/react/24/solid";
import * as yup from "yup";
import AddItem from "@/app/components/admin/communs/ActionOnItem";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import ReactJson from "react-json-view";
import {
    AdjustmentsHorizontalIcon,
    ArrowPathIcon,
    ArrowsUpDownIcon,
    MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import {Input} from "@nextui-org/input";
import {useMutation} from "@tanstack/react-query";
import ActionMenuModerate from "@/app/components/admin/communs/ActionMenu";
import {useSession} from "next-auth/react";

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

const deleteItems = async ({ selectedItems, model }) => {
    console.log("deleteItems called with:", selectedItems, model);
    const data = {
        ids: Array.from(selectedItems),
    };
    try {
        const response = await fetch(`http://localhost:3000/api/${model}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
            console.error("Error details:", errorDetails);
        }
        return await response.json();
    } catch (error) {
        console.error("Error deleting items:", error);
        throw error;
    }
};

export default function ItemsOnTable({formFields,actions, model,columnsGreatNames, items, name, isLoading, create_hidden=false, selectionMode=true ,setRefresh=()=>{console.log("refreshOnContextLater")}}) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const {data: session, status} = useSession();
    const methods = useForm({
        resolver: yupResolver(categorySchema),
        mode: 'onSubmit',
    });
    console.log("actions:", actions); // Add this line to log the prop
    const [selectedItems, setSelectedItems] = useState(new Set());

    const mutation = useMutation({
        mutationFn : deleteItems,
        onMutate: (variables) => {
            console.log("Mutation variables:", variables);
        },
        onSuccess: () => {
            setRefresh(true);
        }

    });
    const handleDeleteItem = () => {
        mutation.mutate({selectedItems, model});
    };
    return (
        <div className="mx-5 flex-1 relative">
            <div className="flex row justify-start items-center">
                <div className="flex flex-row space-x-2">
                    <div className="flex justify-center items-center">
                        <h1 className="text-2xl my-3 font-bold">{name}</h1>
                    </div>
                    <div className="flex justify-center items-center">
                        <Skeleton className="rounded-full"  isLoaded={!isLoading} >
                            <Chip color="default" size="md" radius="full">{items?.length}</Chip>
                        </Skeleton>
                    </div>
                </div>

                {!create_hidden && (
                    <div className="flex items-end ml-auto">
                        <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                            <Button size="md" color="primary" onPress={onOpen} endContent={<PlusCircleIcon height={24} width={24}/>}>Créer</Button>
                            {items &&  <AddItem model={model} setRefresh={setRefresh} formFields={formFields} isOpen={isOpen} onOpenChange={onOpenChange} schema={domainSchema} methods={methods} />}
                        </Skeleton>
                    </div>
                )}
            </div>
            <div className="flex flex-row">
                <div className="w-1/2 flex flex-row justify-end items-center space-x-4">
                    <Input
                        isClearable
                        radius="lg"
                        placeholder="Rechercher..."
                        startContent={
                            <MagnifyingGlassIcon width={24} height={24}/>
                        }
                    />
                    <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    variant="flat"
                                    startContent={<AdjustmentsHorizontalIcon height={24} width={24}/>}
                                >
                                    Filtrer
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="filterBy"
                                variant="flat"
                                closeOnSelect={false}
                                disallowEmptySelection
                                selectionMode="multiple"
                            >
                                {items && Object.keys(items[0]).map((item, index) => {
                                    if (typeof item !== 'object') {
                                        <DropdownItem key={index}>{item}</DropdownItem>
                                    }
                                })}
                            </DropdownMenu>
                        </Dropdown>
                    </Skeleton>
                    <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    variant="flat"
                                    startContent={<ArrowsUpDownIcon height={24} width={24}/>}
                                >
                                    Trier par
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="filterBy"
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
                    </Skeleton>
                    <Button
                        isIconOnly={true}
                        variant="flat"
                        isLoading={isLoading}
                        radius="full"
                        color="default"
                        onPress={setRefresh}
                    >
                        <ArrowPathIcon width={20} height={20}/>
                    </Button>
                    <Divider orientation="vertical" />
                    {selectionMode && selectedItems.size > 0 && (
                        <Button
                            isIconOnly={true}
                            onClick={handleDeleteItem}
                            variant="flat"
                            isLoading={isLoading}
                            radius="full"
                            color="danger"
                            onPress={setRefresh}
                        >
                            <TrashIcon width={20} color="red" height={20}/>
                        </Button>
                    )}
                    {selectionMode && (
                        <div className="flex items-center text-sm uppercase w-full">
                            {selectedItems.size <= 1 ? selectedItems.size + " Selectionné" : selectedItems.size + " Selectionnés"}
                        </div>
                    )}


                </div>
            </div>
            <Skeleton className="rounded-lg h-[400px]" isLoaded={!isLoading}>
                {
                    items ?
                        (<Table
                            aria-label="Rows actions table example with dynamic content"
                            selectionMode={selectionMode ? "multiple" : "none"}
                            onSelectionChange={(selected) => {
                               setSelectedItems(selected);
                            }}
                            selectionBehavior="toggle"
                            shadow="none"
                            color="primary"
                        >
                            <TableHeader>

                                {columnsGreatNames.map((item, index) => (
                                    <TableColumn key={index} align="left">
                                        {item}
                                    </TableColumn>
                                ))}
                                <TableColumn key="actions" align="right" >
                                    {""}
                                </TableColumn>

                            </TableHeader>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={item.id}>
                                        {Object.keys(item).map((key) => (
                                            <TableCell key={key}>
                                                {(() => {
                                                    switch (typeof item[key]) {
                                                        case "object":
                                                            return (
                                                                item[key]?.name ?
                                                                <Tooltip width={300}
                                                                         height={400}
                                                                         title={item[key]?.name || "Inconnu"}
                                                                         placement="bottom"
                                                                         content={
                                                                             session?.user.role === "SUPERADMIN" &&
                                                                             (<div className="px-1 py-2">
                                                                                 <div className="text-tiny">
                                                                                     <ReactJson src={item[key]}
                                                                                                theme="apathy:inverted"/>
                                                                                 </div>
                                                                             </div>)
                                                                         }
                                                                >
                                                                    {item[key]?.name}
                                                                </Tooltip> : <span>vide</span>
                                                            );
                                                        case "number":
                                                            return <Chip color="default" size="md">{item[key]}</Chip>;
                                                        case "boolean":
                                                            return item[key] ? "Oui" : "Non";
                                                        case "string":
                                                            if (!isNaN(Date.parse(item[key]))) {
                                                                return new Date(item[key]).toLocaleDateString('fr-FR',{
                                                                    year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                });
                                                            }
                                                            if(!isNaN(parseInt(item[key]))){
                                                                return <Snippet size="sm" symbol="">{item[key]}</Snippet>
                                                            }
                                                            if(
                                                                item[key] === "DELAYED" ||
                                                                item[key] === "LOCKED" ||
                                                                item[key] === "REJECTED" ||
                                                                item[key] === "ENDED"
                                                            ){
                                                                return <Chip color="danger">{item[key]}</Chip>
                                                            }
                                                            if( item[key] === "WAITING" ||
                                                                item[key] === "PENDING" ||
                                                                item[key] === "BOOKED" ||
                                                                item[key] === "AVAILABLE" ||
                                                                item[key] === "WAITING"
                                                            ){
                                                                return <Chip color="primary">{item[key]}</Chip>
                                                            }

                                                        default:
                                                            return item[key];
                                                    }
                                                })()}
                                            </TableCell>
                                        ))}
                                        <TableCell key={`actions-${item.key}`}>
                                            <ActionMenuModerate actions={actions} entry={item} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>) : (
                            <div className="flex justify-center items-center">
                                <p>Aucun éléments à afficher</p>
                            </div>
                        )}
            </Skeleton>
        </div>
    );
}