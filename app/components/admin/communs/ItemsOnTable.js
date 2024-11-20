import {
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger, getKeyValue, Skeleton,
    Table, TableBody, TableCell,
    TableColumn,
    TableHeader, TableRow, Tooltip, useDisclosure
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import React from "react";
import {EllipsisVerticalIcon} from "@heroicons/react/24/outline";
import {ArrowsRightLeftIcon, EyeIcon, PencilIcon, PlusCircleIcon, TrashIcon} from "@heroicons/react/24/solid";
import * as yup from "yup";
import AddItem, {DeleteConfirmModal} from "@/app/components/admin/communs/ActionOnItem";
import {useForm} from "react-hook-form";
import {yupResolver} from "@hookform/resolvers/yup";
import ItemRow from "@/app/components/admin/communs/ActionMenu";
import ActionMenu from "@/app/components/admin/communs/ActionMenu";
import {Toaster} from "react-hot-toast";
import ReactJson from "react-json-view";

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

const cleanedFieldsForForm = (fields) => {
    return fields.filter(field => field !== 'id' && field !== 'createdAt' && field !== 'updatedAt');
}


export default function ItemsOnTable({items, name, isLoading}) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const methods = useForm({
        resolver: yupResolver(categorySchema),
        mode: 'onSubmit',
    });
    const handleDeleteItem = (id)=>{
        console.log("DELETE ITEM", id);

        return (
            <Toaster
                position="top-center"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                    // Define default options
                    className: '',
                    duration: 5000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },

                    // Default options for specific types
                    success: {
                        duration: 3000,
                        theme: {
                            primary: 'green',
                            secondary: 'black',
                        },
                    },
                }}
            />
        )


    }
    console.log(items);
    return (
        <div className="mx-5">
            <div className="flex flex-row">
                <h1 className="text-2xl p-2 my-3 font-bold w-1/2">{name}</h1>
                <div className="w-1/2 flex flex-row justify-end items-center space-x-4">
                    <Skeleton className="rounded-lg" isLoaded={!isLoading}>
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
                    </Skeleton>
                    <Skeleton className="rounded-lg" isLoaded={!isLoading}>
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
                    </Skeleton>
                    <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                        <Button size="md" color="primary" onPress={onOpen} endContent={<PlusCircleIcon height={24} width={24}/>}>Ajouter</Button>
                        {items &&  <AddItem isOpen={isOpen} onOpenChange={onOpenChange} schema={domainSchema} methods={methods} fields={items?.length > 0 && cleanedFieldsForForm(Object.keys(items[0]))}/>}
                    </Skeleton>
                    </div>
            </div>
            <Skeleton className="rounded-lg h-[400px]"  isLoaded={!isLoading}>
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
                                    {typeof item === "object" &&
                                        <Tooltip showArrow={true} content="I am a tooltip">
                                            <Button>{item.id}</Button>
                                        </Tooltip>}
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
                                            {(() => {
                                                switch (typeof item[key]) {
                                                    case "object":
                                                        return (
                                                            <Tooltip width={200}
                                                                     height={400}
                                                                     title={item[key]?.name || "Inconnu"}
                                                                     content={
                                                                             <div className="px-1 py-2">
                                                                                 <div className="text-tiny">
                                                                                     <ReactJson  src={item[key]} theme="apathy:inverted" />
                                                                                 </div>
                                                                             </div>
                                                                     }>
                                                                {item[key]?.name || "Inconnu"}
                                                            </Tooltip>
                                                        );
                                                    case "boolean":
                                                        return item[key] ? "Oui" : "Non";
                                                    default:
                                                        return item[key];
                                                }
                                            })()}
                                        </TableCell>
                                    ))}
                                    <TableCell key={`actions-${item.key}`}>
                                        {/*<Dropdown>
                                            <DropdownTrigger>
                                                <Button isIconOnly size="sm" variant="light" >
                                                    <EllipsisVerticalIcon width={24} height={24}/>
                                                </Button>
                                            </DropdownTrigger>
                                            <ActionMenu values={item} />
                                        </Dropdown>*/}
                                        <div className="flex flex-row space-x-2">
                                            <Button height={24} width={24} isIconOnly={true} color="primary" variant="bordered"><PencilIcon height={24} width={24} /></Button>
                                            <Button onPress={()=>handleDeleteItem(item.id)}  height={24} width={24} isIconOnly={true} color="danger"  variant="bordered"><TrashIcon color={"red"} height={24} width={24} /></Button>
                                        </div>
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