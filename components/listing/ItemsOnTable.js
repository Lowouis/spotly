import {
    Chip,
    Divider,
    Pagination,
    Skeleton,
    Snippet,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
    useDisclosure
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import React, {useState} from "react";
import {PlusCircleIcon, TrashIcon} from "@heroicons/react/24/solid";
import {
    ArrowPathIcon,
    ArrowsUpDownIcon,
    MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import {Input} from "@nextui-org/input";
import {useMutation} from "@tanstack/react-query";
import ActionMenuModerate from "@/components/actions/ActionMenu";
import {useSession} from "next-auth/react";
import EntryDTO from "@/components/utils/DTO";
import PopupDoubleCheckAction from "@/components/modals/PopupDoubleCheckAction";
import {addToast} from "@heroui/toast";
import {useRefreshContext} from "@/context/RefreshContext";
import TableDropDown from "@/components/actions/TableDropDown";
import {IoMdGlobe} from "react-icons/io";
import {MdOutlineCategory} from "react-icons/md";
import {truncateString} from "@/global";
import ActionOnItem from "@/components/actions/ActionOnItem";
import {BsQuestion} from "react-icons/bs";


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

const deleteItems = async ({selectedItems, model}) => {
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


export default function ItemsOnTable({
                                         formFields,
                                         actions,
                                         model,
                                         columnsGreatNames,
                                         items,
                                         filter,
                                         name,
                                         isLoading,
                                         create_hidden = false,
                                         selectionMode = true,
                                         searchBy = {tag: "nom", attr: "name"}
                                     }) {
    const {isOpen: isOpenOnItem, onOpen: onOpenOnItem, onOpenChange: onOpenChangeOnItem} = useDisclosure();
    const [currentAction, setCurrentAction] = useState("create");
    const [currentItem, setCurrentItem] = useState();
    // Move searchValue state before items memo
    const [searchValue, setSearchValue] = useState("");
    const [page, setPage] = React.useState(1);
    const rowsPerPage = 10;
    const pages = Math.ceil(items?.length / rowsPerPage);

    items = React.useMemo(() => {
        let filteredItems = [...(items || [])];

        if (searchValue.trim()) {
            filteredItems = filteredItems.filter(item => {
                const itemDTO = EntryDTO(item, filter);

                // Debug logs
                console.log('itemDTO:', itemDTO);
                console.log('searchBy:', searchBy);
                console.log('searching for:', searchValue);
                console.log('value to search in:', itemDTO[searchBy.attr]);

                const valueToSearch = itemDTO[searchBy.attr];

                return String(valueToSearch || '')
                    .toLowerCase()
                    .includes(searchValue.toLowerCase());
            });
        }

        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [page, items, searchValue, searchBy]);

    const {
        isOpen: isOpenDeleteConfirm,
        onOpen: onOpenDeleteConfirm,
        onOpenChange: onOpenChangeDeleteConfirm
    } = useDisclosure();
    const {data: session} = useSession();
    const [selectedItems, setSelectedItems] = useState(new Set());
    const {isOpen: isOpenComments, onOpen: onOpenComments, onOpenChange: onOpenChangeComments} = useDisclosure();
    const {refreshData} = useRefreshContext();
    const mutation = useMutation({
        mutationFn: deleteItems,
        onMutate: (variables) => {
            console.log("Mutation variables:", variables);
        },
        onError: () => {
            addToast({
                title: "Suppression d'éléments",
                description: "Une erreur s'est produite lors de la suppression des éléments. Vérifiez que cette élément n'est pas encore relié à un autre.",
                color: "danger"
            })
        },
        onSuccess: () => {
            refreshData([model]);
            setSelectedItems(new Set());
            addToast({
                title: "Suppression",
                description: "Les éléments ont été supprimés avec succès.",
                color: "warning",
                timeout: 5000,
                shouldShowTimeoutProgess: true,
                variant: "flat",
                radius: "sm",
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
                        <path d="M18 6 6 18"/>
                        <path d="m6 6 12 12"/>
                    </svg>
                ),


            });
        }
    });
    const handleDeleteItem = (item) => {
        if (!item) {
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
                        <h1 className="text-2xl my-3 text-neutral-900 dark:text-gray-200">{name}</h1>
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
                        color="default"
                        placeholder={"Rechercher par " + searchBy.tag}
                        startContent={
                            <MagnifyingGlassIcon
                                width={24}
                                height={24}
                                className="text-neutral-500 dark:text-neutral-400"
                            />
                        }
                        value={searchValue}
                        onValueChange={setSearchValue}
                        classNames={{
                            input: "text-neutral-900 dark:text-neutral-200",
                            inputWrapper: "border-neutral-300 dark:border-neutral-700",
                        }}
                    />

                    <Tooltip content={"Rafraîchir les données"} color="foreground" size="sm" showArrow
                             placement="top-end">
                        <Button
                            isIconOnly={true}
                            variant="flat"
                            isLoading={isLoading}
                            radius="full"
                            color="primary"
                            onPress={() => refreshData([model])}
                        >
                            <ArrowPathIcon width={20} height={20}/>
                        </Button>
                    </Tooltip>

                    <Divider orientation="vertical" />
                    {selectionMode && selectedItems.size > 0 && (
                        <Button
                            isIconOnly={true}
                            variant="flat"
                            isLoading={isLoading}
                            radius="full"
                            color="default"
                            onPress={onOpenChangeDeleteConfirm}
                        >
                            <TrashIcon width={20} height={20}/>
                        </Button>
                    )}
                    <PopupDoubleCheckAction
                        onConfirm={handleDeleteItem}
                        isOpen={isOpenDeleteConfirm}
                        onOpenChange={onOpenChangeDeleteConfirm}
                        title="Confirmation de suppression"
                        message={`Voulez-vous vraiment supprimer ${
                            selectedItems.size > 1 ? selectedItems.size : "cet"
                        } élément ?`}
                    />
                    {selectionMode && (
                        <div className="flex items-center text-xs uppercase w-full text-black dark:text-white ">
                            {selectedItems.size <= 1
                                ? selectedItems.size + " selectionné"
                                : selectedItems.size + " selectionnés"}
                        </div>
                    )}
                    {!create_hidden && (
                        <div className="flex items-end ml-auto">
                            <Tooltip content={"Créer un nouvel élément"} color="foreground" size="sm" showArrow>
                                <Button
                                    size="md"
                                    variant="flat"
                                    color="default"
                                    onPress={() => {
                                        setCurrentAction("create");
                                        onOpenOnItem();
                                    }}
                                    endContent={<PlusCircleIcon height={24} width={24}/>}
                                    className="mr-4"
                                >
                                    Créer
                                </Button>
                            </Tooltip>
                            {items && (
                                <ActionOnItem
                                    model={model}
                                    formFields={formFields}
                                    isOpen={isOpenOnItem}
                                    onOpenChange={onOpenChangeOnItem}
                                    action={currentAction}
                                    defaultValues={currentAction === "edit" ? currentItem : null}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Skeleton className="rounded-lg mt-2 h-full" isLoaded={!isLoading}>
                {items && items.length > 0 ? (
                    <Table
                        classNames={{
                            wrapper: "min-h-[222px] max-h-[1000px] overflow-y-auto",
                        }}
                        bottomContent={
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
                        }
                        aria-label="Rows actions table example with dynamic content"
                        selectionMode={selectionMode ? "multiple" : "none"}
                        onSelectionChange={(selected) => {
                            const integerSelected = new Set(Array.from(selected).map(Number));
                            setSelectedItems(integerSelected);
                        }}
                        selectionBehavior="toggle"
                        shadow="none"
                        color="primary"
                        className="mt-2 border border-neutral-200 dark:border-neutral-500 rounded-lg"
                        radius="md"
                    >
                        <TableHeader>
                            {columnsGreatNames.map((item, index) => (
                                <TableColumn key={index} align="left">
                                    {item}
                                </TableColumn>
                            ))}
                            <TableColumn key="actions" align="right">
                                {"<>"}
                            </TableColumn>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => {
                                const itemDTO = EntryDTO(item, filter);
                                return (
                                    <TableRow key={item.id}>
                                        {Object.keys(itemDTO).map((key) => (
                                            <TableCell key={key} className="text-neutral-900 dark:text-gray-200">
                                                {(() => {
                                                    if (
                                                        (itemDTO[key] === "" || itemDTO[key] === null) &&
                                                        key !== "owner" &&
                                                        key !== "pickable"
                                                    ) {
                                                        return <span className="flex justify-center"> - </span>;
                                                    } else if (
                                                        key === "name" ||
                                                        key === "surname" ||
                                                        key === "username" ||
                                                        key === "email" ||
                                                        key === "address" ||
                                                        key === "street_number" ||
                                                        key === "country" ||
                                                        key === "city"
                                                    ) {
                                                        return itemDTO[key];
                                                    } else if (key === "returnedConfirmationCode") {
                                                        return (
                                                            <Snippet
                                                                size="sm"
                                                                disableTooltip
                                                                radius="sm"
                                                                hideSymbol
                                                                hideCopyButton
                                                                color="default"
                                                            >
                                                                {itemDTO[key]}
                                                            </Snippet>
                                                        );
                                                    } else if (key === "pickable") {
                                                        return itemDTO[key] !== null ? ((
                                                                <div
                                                                    className="flex justify-start items-center w-full space-x-1">
                                                                    <Chip className="capitalize" color="warning"
                                                                          size="sm" variant="flat">
                                                                        {itemDTO[key]?.name}
                                                                    </Chip>
                                                                    <Tooltip
                                                                        content={itemDTO[key].description}
                                                                        color="foreground"
                                                                        size="sm"
                                                                        showArrow
                                                                    >
                                                                        <Chip
                                                                            color="default"
                                                                            size="sm"
                                                                            variant="flat"
                                                                            className={"capitalize"}
                                                                        >
                                                                            <BsQuestion/>
                                                                        </Chip>
                                                                    </Tooltip>
                                                                </div>
                                                            )
                                                        ) : (
                                                            item?.category?.pickable !== undefined && item?.category?.pickable !== null ? (
                                                                <div
                                                                    className="flex justify-start items-center w-full space-x-1">
                                                                    <Tooltip
                                                                        content="Hérite de sa catégorie"
                                                                        color="foreground"
                                                                        size="sm"
                                                                        showArrow
                                                                    >
                                                                        <Chip className="capitalize" color="warning"
                                                                              size="sm" variant="flat">
                                                                        <span
                                                                            className="flex flex-row justify-center items-center">
                                                                            {item.category?.pickable.name}
                                                                            <MdOutlineCategory className='ml-2'/>
                                                                        </span>
                                                                        </Chip>
                                                                    </Tooltip>
                                                                    <Tooltip
                                                                        content={item.category.pickable.description}
                                                                        color="foreground"
                                                                        size="sm"
                                                                        showArrow
                                                                    >
                                                                        <Chip color="default" size="sm" variant="flat"
                                                                              className={"capitalize border-1 border-neutral-300"}>
                                                                        <span
                                                                            className="flex flex-row justify-center items-center">
                                                                            ?
                                                                        </span>
                                                                        </Chip>
                                                                    </Tooltip>
                                                                </div>
                                                            ) : item?.domains?.pickable !== undefined && item?.domains?.pickable !== null ? (
                                                                <div
                                                                    className="flex justify-start items-center w-full space-x-1">
                                                                    <Tooltip
                                                                        content="Hérite de son site"
                                                                        color="foreground"
                                                                        size="sm"
                                                                        showArrow
                                                                    >
                                                                        <Chip className="capitalize" color="warning"
                                                                              size="sm" variant="flat">
                                                                            <span
                                                                                className="flex flex-row justify-center items-center space-x-2">
                                                                                {item.domains.pickable.name}
                                                                                <IoMdGlobe/>
                                                                            </span>
                                                                        </Chip>
                                                                    </Tooltip>
                                                                    <Tooltip
                                                                        content={item.domains.pickable.description}
                                                                        color="default"
                                                                        size="sm"
                                                                        showArrow
                                                                    >
                                                                        <Chip color="default" size="sm" variant="flat"
                                                                              className={"capitalize border-1 border-neutral-300"}>
                                                                        <span
                                                                            className="flex flex-row justify-center items-center">
                                                                            ?
                                                                        </span>
                                                                        </Chip>
                                                                    </Tooltip>
                                                                </div>
                                                            ) : (
                                                                <span> - </span>
                                                            )
                                                        );
                                                    } else if (
                                                        key === "owner" ||
                                                        key === "category" ||
                                                        key === "domains" ||
                                                        key === "user" ||
                                                        key === "resource"
                                                    ) {
                                                        return itemDTO[key]?.name ? (
                                                            <span className="flex flex-row justify-start items-center">
                                                                {itemDTO[key]?.name} {itemDTO[key]?.surname}
                                                              </span>
                                                        ) : (
                                                            <div className="flex justify-start items-center w-full">
                                                                {item?.category?.owner?.name ? (
                                                                    <Tooltip content="Hérite de sa catégorie"
                                                                             color="foreground" size="sm" showArrow>
                                                                      <span className="flex items-center gap-1">
                                                                        {item?.category?.owner?.name} {item?.category?.owner?.surname}
                                                                          <MdOutlineCategory/>
                                                                      </span>
                                                                    </Tooltip>
                                                                ) : item?.domains && item.domains?.owner?.name ? (
                                                                    <Tooltip content="Hérite de son site"
                                                                             color="foreground" size="sm" showArrow>
                                                                      <span className="flex items-center gap-1">
                                                                        {item.domains.owner.name} {item.domains.owner.surname}
                                                                          <IoMdGlobe/>
                                                                      </span>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <span>-</span>
                                                                )}
                                                            </div>
                                                        );
                                                    } else if ((key === "moderate" && model === "resources") || key === "external" || key === "returned") {
                                                        return itemDTO[key] ?
                                                            <Chip className="capitalize" color="success" size="sm"
                                                                  variant="flat">
                                                                Oui
                                                            </Chip>
                                                            :
                                                            <Chip className="capitalize" color="danger" size="sm"
                                                                  variant="flat">
                                                                Non
                                                            </Chip>;
                                                    } else if (key === "status" || key === "moderate" || key === "role") {
                                                        return <Chip size="sm" variant="dot" color={
                                                            itemDTO[key] === "AVAILABLE" || itemDTO[key] === "ACCEPTED" || itemDTO[key] === "USER" ? "success"
                                                                : itemDTO[key] === "WAITING" || itemDTO[key] === "ADMIN" ? "warning" :
                                                                    itemDTO[key] === "BOOKED" ? "default" : "danger"
                                                        }>
                                                            {itemDTO[key]}
                                                        </Chip>;
                                                    } else if (
                                                        key === "createdAt" ||
                                                        key === "updatedAt" ||
                                                        key === "lastUpdatedModerateStatus" ||
                                                        key === "startDate" ||
                                                        key === "endDate"
                                                    ) {
                                                        return new Date(itemDTO[key]).toLocaleDateString("fr-FR", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: new Date(itemDTO[key]).getFullYear() === new Date().getFullYear() ? undefined : "2-digit",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        });

                                                    } else if (key === "description") {
                                                        return (
                                                            <span
                                                                className="flex flex-row space-x-2 justify-start items-center">
                                                                <Tooltip
                                                                    showArrow
                                                                    size="sm"
                                                                    variant="flat"
                                                                    color="foreground"
                                                                    content={itemDTO[key]}
                                                                >
                                                                    {truncateString(itemDTO[key], 15)}
                                                                </Tooltip>
                                                            </span>
                                                        );
                                                    }
                                                })()}
                                            </TableCell>
                                        ))}
                                        <TableCell key={`actions-${item.key}`}>
                                            <ActionMenuModerate
                                                actions={actions}
                                                onActionDelete={() => {
                                                    setSelectedItems(new Set([item.id]));
                                                    onOpenChangeDeleteConfirm();
                                                }}
                                                onActionEdit={() => {
                                                    setCurrentAction("edit");
                                                    setCurrentItem(item);
                                                    onOpenOnItem();
                                                }}
                                                entry={item}
                                                isOpen={isOpenDeleteConfirm}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex justify-center items-center mt-10 text-slate-600">
                        <p>Aucun éléments à afficher</p>
                    </div>
                )}
            </Skeleton>

        </div>
    );

}
