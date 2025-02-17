import {
    ButtonGroup,
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
import EntryDTO, {EntriesDTO} from "@/app/components/utils/DTO";
import {isValidDateTimeFormat} from "@/app/utils/global";
import PopupDoubleCheckAction from "@/app/components/utils/PopupDoubleCheckAction";

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
    const data = {
        ids: Array.from(selectedItems),
    };
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/${model}`, {
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

export default function ItemsOnTable({formFields, actions, model, columnsGreatNames, items, filter, name, isLoading, create_hidden=false, selectionMode=true ,setRefresh=()=>{console.log("refreshOnContextLater")}}) {
    const {isOpen : isOpenOnItem, onOpen : onOpenOnItem, onOpenChange : onOpenChangeOnItem} = useDisclosure();
    const [currentAction, setCurrentAction] = useState("create");
    const [currentItem, setCurrentItem] = useState();
    console.log("current item ", currentItem);
    const {isOpen : isOpenDeleteConfirm, onOpen : onOpenDeleteConfirm, onOpenChange : onOpenChangeDeleteConfirm} = useDisclosure();
    const {data: session} = useSession();
    const methods = useForm({
        resolver: yupResolver(categorySchema),
        mode: 'onSubmit',
    });
    const [selectedItems, setSelectedItems] = useState(new Set());

    const mutation = useMutation({
        mutationFn : deleteItems,
        onMutate: (variables) => {
            console.log("Mutation variables:", variables);
        },
        onSuccess: () => {
            setRefresh(true);
            setSelectedItems(new Set());
        }
    });
    const handleDeleteItem = (item) => {
        if(!item){
            mutation.mutate({selectedItems, model});
        } else {
            mutation.mutate({selectedItems: new Set([item]), model});
        }
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
                            <Chip color="default" size="md" radius="full">{items?.length ? items?.length : "0"}</Chip>
                        </Skeleton>
                    </div>
                </div>
            </div>
            <div className="flex flex-row">
                <div className="flex flex-row justify-end items-center space-x-4 w-full">
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
                            {/*<DropdownMenu
                                aria-label="filterBy"
                                variant="flat"
                                closeOnSelect={false}
                                disallowEmptySelection
                                selectionMode="multiple"
                            >
                                {items && Object.keys(items[0]).map((item, index) => {
                                    if (item && typeof item !== 'object') {
                                        <DropdownItem key={index}>{item}</DropdownItem>
                                    }
                                })}
                            </DropdownMenu>*/}
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
                            {/*<DropdownMenu
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
                            </DropdownMenu>*/}
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
                            variant="flat"
                            isLoading={isLoading}
                            radius="full"
                            color="danger"
                            onPress={onOpenChangeDeleteConfirm}
                        >
                            <TrashIcon width={20} color="red" height={20}/>
                        </Button>
                    )}
                    <PopupDoubleCheckAction
                        onConfirm={handleDeleteItem}
                        isOpen={isOpenDeleteConfirm}
                        onOpenChange={onOpenChangeDeleteConfirm}
                        title="Confirmation de suppression"
                        message={`Voulez-vous vraiment supprimer ${selectedItems.size > 1 ? selectedItems.size : 'cet'} élément ?`}
                    />

                    {selectionMode && (
                        <div className="flex items-center text-xs uppercase w-full text-slate-500">
                            {selectedItems.size <= 1 ? selectedItems.size + " selectionné" : selectedItems.size + " selectionnés"}
                        </div>
                    )}
                    {!create_hidden && (
                        <div className="flex items-end ml-auto">
                            <Skeleton className="rounded-lg" isLoaded={!isLoading}>
                                <Button size="md" color="primary"
                                        onPress={()=> {
                                            setCurrentAction('create');
                                        onOpenOnItem();
                                        }}
                                        endContent={<PlusCircleIcon height={24} width={24}/>}
                                        className="mr-4"
                                >
                                    Créer
                                </Button>
                                {items &&
                                    <AddItem
                                        model={model}
                                        setRefresh={setRefresh}
                                        formFields={formFields}
                                        isOpen={isOpenOnItem}
                                        onOpenChange={onOpenChangeOnItem}
                                        schema={domainSchema}
                                        methods={methods}
                                        action={currentAction}
                                        defaultValues={currentAction === "edit" ? currentItem : null}
                                    />
                                }
                            </Skeleton>
                        </div>
                    )}


                </div>
            </div>
            <Skeleton className="rounded-lg h-[400px]" isLoaded={!isLoading}>
                {
                    items && items.length > 0 ?
                        (<Table
                            aria-label="Rows actions table example with dynamic content"
                            selectionMode={selectionMode ? "multiple" : "none"}
                            onSelectionChange={(selected) => {
                                const integerSelected = new Set(Array.from(selected).map(Number));
                                setSelectedItems(integerSelected);
                            }}
                            selectionBehavior="toggle"
                            shadow="none"
                            color="primary"
                            className="mt-3"
                            radius="md"
                        >
                            <TableHeader>
                                {columnsGreatNames.map((item, index) => (
                                    <TableColumn key={index} align="left">
                                        {item}
                                    </TableColumn>
                                ))}
                                <TableColumn key="actions" align="right" >
                                    {"<>"}
                                </TableColumn>
                            </TableHeader>
                            <TableBody>
                                {items.map((item, index) => {
                                    const itemDTO = EntryDTO(item, filter);
                                    console.log(itemDTO);
                                    return (
                                        <TableRow key={item.id}>
                                            {Object.keys(itemDTO).map((key) => (
                                                <TableCell key={key}>
                                                    {(() => {
                                                        switch (typeof itemDTO[key]) {
                                                            case "object":
                                                                return (
                                                                    itemDTO[key]?.name ?
                                                                        <Tooltip width={300}
                                                                                 height={400}
                                                                                 title={itemDTO[key]?.name || "Inconnu"}
                                                                                 placement="bottom"
                                                                                 content={
                                                                                     session?.user.role === "SUPERADMIN" &&
                                                                                     (<div className="px-1 py-2">
                                                                                         <div className="text-tiny">
                                                                                             {itemDTO[key]?.name}
                                                                                         </div>
                                                                                     </div>)
                                                                                 }
                                                                        >
                                                                            {itemDTO[key]?.name}
                                                                        </Tooltip> :
                                                                        <div className="flex justify-center items-center w-full">
                                                                            -
                                                                        </div>

                                                                );
                                                            case "number":
                                                                return <Chip color="default"
                                                                             size="md">{itemDTO[key]}</Chip>;
                                                            case "boolean":
                                                                return itemDTO[key] ? "Oui" : "Non";
                                                            case "string":
                                                                if (isValidDateTimeFormat(itemDTO[key])) {
                                                                    return new Date(itemDTO[key]).toLocaleDateString('fr-FR', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    });
                                                                }else if (!isNaN(parseInt(itemDTO[key]))) {
                                                                    return <Snippet size="sm"
                                                                                    symbol="">{itemDTO[key]}</Snippet>
                                                                } else if(itemDTO[key] === itemDTO[key].toUpperCase()) {
                                                                    return <Chip color="default">{itemDTO[key]}</Chip>
                                                                }

                                                            default:
                                                                return itemDTO[key];
                                                        }
                                                    })()}
                                                </TableCell>
                                            ))}
                                            <TableCell key={`actions-${item.key}`}>
                                                <ActionMenuModerate
                                                    actions={actions}
                                                    onActionDelete={()=> {
                                                        setSelectedItems(new Set([item.id]));
                                                        onOpenChangeDeleteConfirm();
                                                    }}
                                                    onActionEdit={()=> {
                                                        setCurrentAction('edit');
                                                        setCurrentItem(item);
                                                        onOpenOnItem();
                                                    }}
                                                    entry={item}

                                                    isOpen={isOpenDeleteConfirm}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>) : (
                            <div className="flex justify-center items-center mt-10 text-slate-600">
                                <p>Aucun éléments à afficher</p>
                            </div>
                        )}
            </Skeleton>
        </div>
    );
}