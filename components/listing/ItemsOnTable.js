import {
    Chip,
    Divider,
    Pagination,
    Select,
    SelectItem,
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
import {ArrowPathIcon, MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {Input} from "@nextui-org/input";
import {useMutation} from "@tanstack/react-query";
import ActionMenuModerate from "@/components/actions/ActionMenu";
import {useSession} from "next-auth/react";
import EntryDTO from "@/components/utils/DTO";
import PopupDoubleCheckAction from "@/components/modals/PopupDoubleCheckAction";
import {addToast} from "@heroui/toast";
import {useRefreshContext} from "@/context/RefreshContext";
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
    console.log(model)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/${model}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
    }

    return response.json();
};

const deleteItems = async ({selectedItems, model}) => {
    const data = {
        ids: Array.from(selectedItems),
    };
    console.log("Deleting items with IDs:", data); // Log the data being sent to the server
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/${model}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.log("Response status:", response.status);
            const errorDetails = await response.json();
            console.error("Error details:", errorDetails);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

// Composants de rendu pour chaque type de donnée
const EmptyCell = () => <span className="flex justify-center"> - </span>;

const TextCell = ({value}) => value;

const CodeCell = ({value}) => (
    <Snippet size="sm" radius="sm" hideSymbol color="default">
        {value}
    </Snippet>
);

const PickableCell = ({item, itemDTO}) => {
    if (itemDTO.pickable) {
        return (
            <div className="flex justify-start items-center w-full space-x-1">
                <Chip className="capitalize" color="warning" size="sm" variant="flat">
                    {itemDTO.pickable?.distinguishedName}
                </Chip>
                <Tooltip content={itemDTO.pickable.description} color="foreground" size="sm" showArrow>
                    <Chip color="default" size="sm" variant="flat" className="capitalize">
                        <BsQuestion/>
                    </Chip>
                </Tooltip>
            </div>
        );
    }

    if (item?.category?.pickable) {
        return (
            <div className="flex justify-start items-center w-full space-x-1">
                <Tooltip content="Hérite de sa catégorie" color="foreground" size="sm" showArrow>
                    <Chip className="capitalize" color="warning" size="sm" variant="flat">
                        <span className="flex flex-row justify-center items-center">
                            {item.category.pickable.distinguishedName}
                            <MdOutlineCategory className='ml-2'/>
                        </span>
                    </Chip>
                </Tooltip>
                <Tooltip content={item.category.pickable.description} color="foreground" size="sm" showArrow>
                    <Chip color="default" size="sm" variant="flat" className="capitalize">
                        <span className="flex flex-row justify-center items-center">?</span>
                    </Chip>
                </Tooltip>
            </div>
        );
    }

    if (item?.domains?.pickable) {
        return (
            <div className="flex justify-start items-center w-full space-x-1">
                <Tooltip content="Hérite de son site" color="foreground" size="sm" showArrow>
                    <Chip className="capitalize" color="warning" size="sm" variant="flat">
                        <span className="flex flex-row justify-center items-center space-x-2">
                            {item.domains.pickable.distinguishedName}
                            <IoMdGlobe/>
                        </span>
                    </Chip>
                </Tooltip>
                <Tooltip content={item.domains.pickable.description} color="foreground" size="sm">
                    <Chip color="default" size="sm" variant="flat" className="capitalize">
                        <span className="flex flex-row justify-center items-center">?</span>
                    </Chip>
                </Tooltip>
            </div>
        );
    }

    return <EmptyCell/>;
};

const OwnerCell = ({item, itemDTO}) => {
    if (itemDTO.owner?.name) {
        return (
            <span className="flex flex-row justify-start items-center">
                {itemDTO.owner.name} {itemDTO.owner.surname}
            </span>
        );
    }

    if (item?.category?.owner?.name) {
        return (
            <Tooltip content="Hérite de sa catégorie" color="foreground" size="sm" showArrow>
                <span className="flex items-center gap-1">
                    {item.category.owner.name} {item.category.owner.surname}
                    <MdOutlineCategory/>
                </span>
            </Tooltip>
        );
    }

    if (item?.domains?.owner?.name) {
        return (
            <Tooltip content="Hérite de son site" color="foreground" size="sm" showArrow>
                <span className="flex items-center gap-1">
                    {item.domains.owner.name} {item.domains.owner.surname}
                    <IoMdGlobe/>
                </span>
            </Tooltip>
        );
    }

    return <EmptyCell/>;
};

const BooleanCell = ({value}) => (
    <Chip
        className="capitalize"
        color={value ? "success" : "danger"}
        size="sm"
        variant="flat"
    >
        {value ? "Oui" : "Non"}
    </Chip>
);

const StatusCell = ({value}) => (
    <Chip
        size="sm"
        variant="dot"
        color={value === "AVAILABLE" ? "success" : "danger"}
    >
        {value === "AVAILABLE" ? "Disponible" : "Indisponible"}
    </Chip>
);

const RoleCell = ({value}) => (
    <Chip
        size="sm"
        variant="dot"
        color={value === "USER" ? "success" : "warning"}
    >
        {value === "USER" ? "Utilisateur" : "Administrateur"}
    </Chip>
);

const ModerateCell = ({value}) => {
    const getColor = (status) => {
        if (["AVAILABLE", "ACCEPTED", "USER"].includes(status)) return "success";
        if (["WAITING", "ADMIN"].includes(status)) return "warning";
        if (status === "BOOKED") return "default";
        return "danger";
    };

    const getTranslation = (status) => {
        const translations = {
            "AVAILABLE": "Disponible",
            "ACCEPTED": "Acceptée",
            "WAITING": "En attente",
            "REJECTED": "Refusée",
            "USED": "En cours",
            "RETURNED": "Restituée",
            "DELAYED": "En retard",
            "USER": "Utilisateur",
            "ADMIN": "Administrateur",
            "ENDED": "Terminée",
        };
        return translations[status] || status;
    };

    return (
        <Chip size="sm" variant="dot" color={getColor(value)}>
            {getTranslation(value)}
        </Chip>
    );
};

const DateCell = ({value}) => (
    new Date(value).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: new Date(value).getFullYear() === new Date().getFullYear() ? undefined : "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    })
);

const DescriptionCell = ({value}) => (
    <span className="flex flex-row space-x-2 justify-start items-center">
        <Tooltip showArrow size="sm" variant="flat" color="foreground" content={value}>
            {truncateString(value, 15)}
        </Tooltip>
    </span>
);

const ObjectCell = ({value, item}) => {
    if (!value || typeof value !== 'object') return <EmptyCell/>;

    // Si l'objet a une propriété name, on l'affiche
    if (value.name) {
        return (
            <span className="flex flex-row justify-start items-center">
                {value.name} {value.surname}
            </span>
        );
    }

    // Si l'objet a une propriété distinguishedName (pour pickable)
    if (value.distinguishedName) {
        return (
            <div className="flex justify-start items-center w-full space-x-1">
                <Chip className="capitalize" color="warning" size="sm" variant="flat">
                    {value.distinguishedName}
                </Chip>
                {value.description && (
                    <Tooltip content={value.description} color="foreground" size="sm" showArrow>
                        <Chip color="default" size="sm" variant="flat" className="capitalize">
                            <BsQuestion/>
                        </Chip>
                    </Tooltip>
                )}
            </div>
        );
    }

    // Pour les autres objets, on affiche une représentation JSON
    return (
        <Tooltip content={JSON.stringify(value, null, 2)} color="foreground" size="sm" showArrow>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {Object.keys(value).length} propriétés
            </span>
        </Tooltip>
    );
};

// Fonction principale de rendu
const renderCell = (key, itemDTO, item, model) => {
    // Liste des clés qui doivent afficher un texte simple
    const textKeys = ["name", "surname", "username", "email", "address", "street_number", "country", "libelle", "city"];

    // Liste des clés qui doivent afficher un code
    const codeKeys = ["returnedConfirmationCode", "ip"];

    // Liste des clés qui doivent afficher un propriétaire
    const ownerKeys = ["owner", "category", "domains", "user", "resource"];

    // Liste des clés qui doivent afficher une date
    const dateKeys = ["createdAt", "updatedAt", "lastUpdatedModerateStatus", "startDate", "endDate"];

    // Cas où la valeur est vide
    if ((itemDTO[key] === "" || itemDTO[key] === null) && !["owner", "pickable"].includes(key)) {
        return <EmptyCell/>;
    }

    // Cas où la valeur est un objet
    if (itemDTO[key] && typeof itemDTO[key] === 'object' && !Array.isArray(itemDTO[key])) {
        return <ObjectCell value={itemDTO[key]} item={item}/>;
    }

    // Mapping des types de cellules
    const cellTypes = {
        text: textKeys.includes(key) && <TextCell value={itemDTO[key]}/>,
        code: codeKeys.includes(key) && <CodeCell value={itemDTO[key]}/>,
        pickable: key === "pickable" && <PickableCell item={item} itemDTO={itemDTO}/>,
        owner: ownerKeys.includes(key) && <OwnerCell item={item} itemDTO={itemDTO}/>,
        boolean: ((key === "moderate" && model === "resources") || key === "external" || key === "returned") &&
            <BooleanCell value={itemDTO[key]}/>,
        status: key === "status" && <StatusCell value={itemDTO[key]}/>,
        role: key === "role" && <RoleCell value={itemDTO[key]}/>,
        moderate: key === "moderate" && <ModerateCell value={itemDTO[key]}/>,
        date: dateKeys.includes(key) && <DateCell value={itemDTO[key]}/>,
        description: key === "description" && <DescriptionCell value={itemDTO[key]}/>
    };

    // Retourne le premier type de cellule non-null trouvé
    return Object.values(cellTypes).find(cell => cell) || <EmptyCell/>;
};

const statusMapping = {
    "ACCEPTED": "Accepté",
    "USED": "Utilisé",
    "REJECTED": "Rejeté",
    "ENDED": "Terminé",
    "WAITING": "En attente",
    "BLOCKED": "Bloqué"
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
                                         searchBy = {tag: "nom", attr: "name"},
                                         filterableStatus = false
                                     }) {
    const {isOpen: isOpenOnItem, onOpen: onOpenOnItem, onOpenChange: onOpenChangeOnItem} = useDisclosure();
    const [currentAction, setCurrentAction] = useState("create");
    const [currentItem, setCurrentItem] = useState();
    const [searchValue, setSearchValue] = useState("");
    const [selectedStatus, setSelectedStatus] = useState(new Set([]));
    const [page, setPage] = React.useState(1);
    const rowsPerPage = 10;

    // Obtenir les status uniques disponibles dans les items
    const availableStatuses = React.useMemo(() => {
        if (!items || !filterableStatus) return [];
        const statuses = new Set(items.map(item => item.moderate));
        return Array.from(statuses).filter(Boolean);
    }, [items, filterableStatus]);

    const searchByArray = React.useMemo(
        () => Array.isArray(searchBy) ? searchBy : [searchBy],
        [searchBy]
    );

    items = React.useMemo(() => {
        let filteredItems = [...(items || [])];

        // Filtrage par status
        if (filterableStatus && selectedStatus.size > 0) {
            filteredItems = filteredItems.filter(item =>
                selectedStatus.has(item.moderate)
            );
        }

        // Filtrage par recherche
        if (searchValue.trim()) {
            filteredItems = filteredItems.filter(item => {
                const itemDTO = EntryDTO(item, filter);
                return searchByArray.some(({attr}) => {
                    const valueToSearch = attr.split('.').reduce((obj, key) => {
                        return obj && obj[key];
                    }, itemDTO);

                    return String(valueToSearch || '')
                        .toLowerCase()
                        .includes(searchValue.toLowerCase());
                });
            });
        }

        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [items, searchValue, page, filter, searchByArray, selectedStatus, filterableStatus]);

    const pages = Math.ceil(items?.length / rowsPerPage);

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
        console.log("Deleting item(s):", item);
        if (!item) {
            mutation.mutate({selectedItems, model});
        } else {
            mutation.mutate({selectedItems: new Set([item]), model});
        }
    };

    // Modifier le placeholder de l'input de recherche
    const searchPlaceholder = searchByArray.length === 1
        ? `Rechercher par ${searchByArray[0].tag}`
        : `Rechercher par ${searchByArray.map(s => s.tag).join(', ')}`;

    return (
        <div className="mx-5 flex-1 relative">
            <div className="flex row justify-start items-center">
                <div className="flex flex-row space-x-2">
                    <div className="flex justify-center items-center">
                        <h1 className="text-2xl my-3 text-content-primary dark:text-dark-content-primary">{name}</h1>
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
                        placeholder={searchPlaceholder}
                        startContent={
                            <MagnifyingGlassIcon
                                width={24}
                                height={24}
                                className="text-content-tertiary dark:text-dark-content-tertiary"
                            />
                        }
                        value={searchValue}
                        onValueChange={setSearchValue}
                        classNames={{
                            input: "text-content-primary dark:text-dark-content-primary",
                            inputWrapper: "border-neutral-300 dark:border-neutral-700",
                            placeholder: "text-content-tertiary dark:text-dark-content-tertiary"
                        }}
                    />
                    {filterableStatus && availableStatuses.length > 0 && (
                        <Select
                            placeholder="Filtrer par status"
                            selectedKeys={selectedStatus}
                            onSelectionChange={setSelectedStatus}
                            selectionMode="multiple"
                            className="max-w-xs"
                            size="xs"
                            classNames={{
                                label: "text-content-primary dark:text-dark-content-primary",
                                value: "text-content-primary dark:text-dark-content-primary",
                                description: "text-content-secondary dark:text-dark-content-secondary",
                                trigger: "text-content-primary dark:text-dark-content-primary",
                                placeholder: "text-content-secondary dark:text-dark-content-secondary",
                                listbox: "text-content-primary dark:text-dark-content-primary"
                            }}
                        >
                            {availableStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {statusMapping[status] || status}
                                </SelectItem>
                            ))}
                        </Select>
                    )}
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
                        className="dark:border-neutral-500 rounded-lg"
                        radius="md"
                    >
                        <TableHeader>
                            {columnsGreatNames.map((item, index) => (
                                <TableColumn key={index} align="left"
                                             className="text-content-primary dark:text-dark-content-primary">
                                    {item}
                                </TableColumn>
                            ))}
                            <TableColumn key="actions" align="right"
                                         className="text-content-primary dark:text-dark-content-primary">
                                {"<>"}
                            </TableColumn>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => {
                                const itemDTO = EntryDTO(item, filter);
                                return (
                                    <TableRow key={item.id}>
                                        {Object.keys(itemDTO).map((key) => (
                                            <TableCell key={key}
                                                       className="text-content-primary dark:text-dark-content-primary">
                                                {renderCell(key, itemDTO, item, model)}
                                            </TableCell>
                                        ))}
                                        <TableCell key={`actions-${item.key}`}
                                                   className="text-content-primary dark:text-dark-content-primary">
                                            <ActionMenuModerate
                                                handleRefresh={() => refreshData([model])}
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
