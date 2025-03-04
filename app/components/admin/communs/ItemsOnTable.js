import {
    Chip,
    Divider,
    Dropdown,
    DropdownTrigger, Pagination, Skeleton, Snippet,
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
import EntryDTO from "@/app/components/utils/DTO";
import {isValidDateTimeFormat} from "@/app/utils/global";
import PopupDoubleCheckAction from "@/app/components/utils/PopupDoubleCheckAction";
import {addToast} from "@heroui/toast";
import {useRefreshContext} from "@/app/context/RefreshContext";
import {DropdownItem, DropdownMenu} from "@heroui/react";
import TableDropDown from "@/app/components/admin/communs/TableDropDown";

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

export const postItem = async ({data, model}) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/${model}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to create item');
    }

    return response.json();
};

export const updateItem = async ({data, model}) => {
    console.log("--> DATA -->", data);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/${model}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to create item');
    }

    return response.json();
};

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
        throw error;
    }
};

export default function ItemsOnTable({formFields, actions, model, columnsGreatNames, items, filter, name, isLoading, create_hidden=false, selectionMode=true}) {
    const {isOpen : isOpenOnItem, onOpen : onOpenOnItem, onOpenChange : onOpenChangeOnItem} = useDisclosure();
    const [currentAction, setCurrentAction] = useState("create");
    const [currentItem, setCurrentItem] = useState();
    const { refreshData } = useRefreshContext();
    const [page, setPage] = React.useState(1);
    const rowsPerPage = 10;
    const pages = Math.ceil(items?.length / rowsPerPage);
    items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return items?.slice(start, end);
    }, [page, items]);

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
        onError: () => {
            addToast({
                title: "Suppression d'éléments",
                description : "Une erreur s'est produite lors de la suppression des éléments. Vérifiez que cette élément n'est pas encore relié à un autre.",
                color : "danger"
          })
        },
        onSuccess: () => {
            refreshData([model]);
            setSelectedItems(new Set());
            addToast({
                title: "Suppression",
                description : "Les éléments ont été supprimés avec succès.",
                color : "warning",
                timeout: 5000,
                shouldShowTimeoutProgess: true,
                variant : "flat",
                radius : "sm",
                classNames: {
                    closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
                },
                closeIcon: (
                    <svg
                        fill="none"
                        height="32"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="32"
                    >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                ),


            });
        }
    });
    const handleDeleteItem = (item) => {
        if(!item){
            mutation.mutate({selectedItems, model});
        } else {
            mutation.mutate({selectedItems: new Set([item]), model});
        }
    };


    const dropdownitems = [
        {
            key: "new",
            label: "New file",
        },
        {
            key: "copy",
            label: "Copy link",
        },
        {
            key: "edit",
            label: "Edit file",
        },
        {
            key: "delete",
            label: "Delete file",
        },
    ];


    return (
        <div className="mx-5 flex-1 relative">
            <div className="flex row justify-start items-center">
                <div className="flex flex-row space-x-2">
                    <div className="flex justify-center items-center">
                        <h1 className="text-2xl my-3 font-bold">{name}</h1>
                    </div>
                    <div className="flex justify-center items-center">
                            <Button 
                                color="primary" 
                                size="md" 
                                radius="full"
                                isLoading={isLoading}
                                isIconOnly
                                isDisabled
                                >
                                    {items?.length ? items?.length : "0"}
                            </Button>
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

                    <TableDropDown icon={
                        <AdjustmentsHorizontalIcon color='#444937' height={25} width={25}/>
                    }
                                items={dropdownitems}
                    />
                    <TableDropDown icon={
                        <ArrowsUpDownIcon color="#444937" height={25} width={25}/>
                    }
                                items={dropdownitems}
                    />

                    <Button
                        isIconOnly={true}
                        variant="flat"
                        isLoading={isLoading}
                        radius="full"
                        color="primary"
                        onPress={()=>refreshData([model])}
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
                                <Button
                                    size="md"
                                    variant="flat"
                                    color="primary"
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
                                        formFields={formFields}
                                        isOpen={isOpenOnItem}
                                        onOpenChange={onOpenChangeOnItem}
                                        schema={domainSchema}
                                        methods={methods}
                                        action={currentAction}
                                        defaultValues={currentAction === "edit" ? currentItem : null}
                                    />
                                }
                        </div>
                    )}


                </div>
            </div>
            <Skeleton className="rounded-lg mt-2 h-full" isLoaded={!isLoading}>
                {
                    items && items.length > 0 ?
                        (<Table
                            classNames={{
                                wrapper: "min-h-[222px] max-h-[1000px] overflow-y-auto",
                            }}
                            bottomContent={(
                                <div className="flex w-full justify-center">
                                    <Pagination
                                        loop
                                        siblings={3}
                                        color="default"
                                        variant="light"
                                        page={page}
                                        total={pages}
                                        size={"md"}
                                        classNames={{
                                            cursor: "bg-foreground text-background",
                                        }}
                                        onChange={(page) => setPage(page)}
                                    />
                                </div>
                            )}
                            aria-label="Rows actions table example with dynamic content"
                            selectionMode={selectionMode ? "multiple" : "none"}
                            onSelectionChange={(selected) => {
                                const integerSelected = new Set(Array.from(selected).map(Number));
                                setSelectedItems(integerSelected);
                            }}
                            selectionBehavior="toggle"
                            shadow="none"
                            color="primary"
                            className="mt-2 border border-neutral-200 rounded-lg"
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
                                                                if(itemDTO[key] === "" || itemDTO[key] === null){
                                                                    return (
                                                                        <div className="flex justify-center items-center w-full">
                                                                            -
                                                                        </div>
                                                                    )
                                                                } else if (isValidDateTimeFormat(itemDTO[key])) {
                                                                    return new Date(itemDTO[key]).toLocaleDateString('fr-FR', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    });
                                                                }else if (!isNaN(parseInt(itemDTO[key]))) {
                                                                    return (
                                                                            <Snippet size="sm" radius="md" symbol={""} color="primary">
                                                                            {itemDTO[key]}
                                                                            </Snippet>
                                                                    );
                                                                } else if(itemDTO[key] === itemDTO[key].toUpperCase()) {
                                                                    return (
                                                                        <Chip className="capitalize" color ="primary" size="sm" variant="flat">
                                                                            {itemDTO[key]}
                                                                        </Chip>
                                                                    )
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
                        )
                }

            </Skeleton>
        </div>
    );
}