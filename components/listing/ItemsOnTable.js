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
} from "@heroui/react";
import {Button} from "@heroui/button";
import React, {useState} from "react";
import {PlusCircleIcon, TrashIcon} from "@heroicons/react/24/solid";
import {ArrowPathIcon, ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {Input} from "@heroui/input";
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
import ModalCheckingBooking from "@/components/modals/ModalCheckingBooking";


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
        const errorData = await response.json();
        throw errorData;
    }

    return response.json();
};

const deleteItems = async ({selectedItems, model}) => {
    const data = Array.from(selectedItems);
   
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/${model}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ids: data}),
        });

        if (!response.ok) {
            const errorDetails = await response.json();
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

    // Pour les catégories et les domaines (sites), vérifier directement la propriété pickable
    if (item?.pickable) {
        return (
            <div className="flex justify-start items-center w-full space-x-1">
                <Chip className="capitalize" color="warning" size="sm" variant="flat">
                    {item.pickable.distinguishedName}
                </Chip>
                <Tooltip content={item.pickable.description} color="foreground" size="sm" showArrow>
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

const RoleCell = ({value}) => {
    const translations = {
        "USER": "Utilisateur",
        "ADMIN": "Manager",
        "SUPERADMIN": "Administrateur",
    };
    return (<Chip
        size="sm"
        variant="dot"
        color={value === "USER" ? "success" : value === "ADMIN" ? "warning" : "danger"}
    >
        {translations[value]}
    </Chip>)
};

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
    const ownerKeys = ["owner"];

    // Liste des clés qui doivent afficher une date
    const dateKeys = ["createdAt", "updatedAt", "lastUpdatedModerateStatus", "startDate", "endDate"];

    // Cas où la valeur est vide
    if ((itemDTO[key] === "" || itemDTO[key] === null) && !["owner", "pickable", "user", "resource"].includes(key)) {
        return <EmptyCell/>;
    }

    // Vérifier d'abord les composants spécialisés
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

    // Vérifier si un composant spécialisé est disponible
    const specializedCell = Object.values(cellTypes).find(cell => cell);
    if (specializedCell) {
        return specializedCell;
    }

    // Cas spécial pour user et resource
    if (key === "user" && itemDTO[key]) {
        return (
            <span className="flex flex-row justify-start items-center">
                {itemDTO[key].name} {itemDTO[key].surname}
            </span>
        );
    }

    if (key === "resource" && itemDTO[key]) {
        return (
            <span className="flex flex-row justify-start items-center">
                {itemDTO[key].name}
            </span>
        );
    }

    // Cas où la valeur est un objet (seulement si aucun composant spécialisé n'est trouvé)
    if (itemDTO[key] && typeof itemDTO[key] === 'object' && !Array.isArray(itemDTO[key])) {
        return <ObjectCell value={itemDTO[key]} item={item}/>;
    }

    // Si aucun cas ne correspond
    return <EmptyCell/>;
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
                                         filters = []
                                     }) {
    const {isOpen: isOpenOnItem, onOpen: onOpenOnItem, onOpenChange: onOpenChangeOnItem} = useDisclosure();
    const [currentAction, setCurrentAction] = useState("create");
    const [currentItem, setCurrentItem] = useState();
    const [searchValue, setSearchValue] = useState("");
    const [selectedFilters, setSelectedFilters] = useState({});
    const [page, setPage] = React.useState(1);
    const rowsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({key: null, direction: 'asc'});

    // États pour le modal de consultation des réservations
    const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    // Obtenir les valeurs uniques disponibles pour chaque filtre
    const availableFilterValues = React.useMemo(() => {
        if (!items || !filters.length) return {};

        return filters.reduce((acc, {filterBy}) => {
            const values = new Set();
            items.forEach(item => {
                const value = filterBy.split('.').reduce((obj, key) => obj && obj[key], item);
                if (value) values.add(value);
            });
            acc[filterBy] = Array.from(values).filter(Boolean);
            return acc;
        }, {});
    }, [items, filters]);

    const searchByArray = React.useMemo(
        () => Array.isArray(searchBy) ? searchBy : [searchBy],
        [searchBy]
    );

    const {filteredItems, paginatedItems} = React.useMemo(() => {
        let filtered = [...(items || [])];

        // Filtrage par les filtres dynamiques
        Object.entries(selectedFilters).forEach(([filterBy, selectedValues]) => {
            if (selectedValues.size > 0) {
                filtered = filtered.filter(item => {
                    const value = filterBy.split('.').reduce((obj, key) => obj && obj[key], item);
                    return selectedValues.has(value);
                });
            }
        });

        // Filtrage par recherche
        if (searchValue.trim()) {
            filtered = filtered.filter(item => {
                const itemDTO = EntryDTO(item, filter);
                return searchByArray.some(({attr}) => {
                    const valueToSearch = attr.split('.').reduce((obj, key) => obj && obj[key], itemDTO);
                    return String(valueToSearch || '').toLowerCase().includes(searchValue.toLowerCase());
                });
            });
        }

        // Tri alphabétique sur la colonne 'name' uniquement
        if (sortConfig.key === 'name') {
            filtered.sort((a, b) => {
                const aValue = (a.name || '').toLowerCase();
                const bValue = (b.name || '').toLowerCase();
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginated = filtered.slice(start, end);

        return {filteredItems: filtered, paginatedItems: paginated};
    }, [items, searchValue, page, filter, searchByArray, selectedFilters, sortConfig]);

    const totalItems = filteredItems.length;
    const pages = Math.ceil(totalItems / rowsPerPage);

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

    // Fonction pour ouvrir le modal de consultation des réservations
    const handleConsultEntry = (entry) => {
        setSelectedEntry(entry);
        setIsConsultModalOpen(true);
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
                            aria-label="Nombre total d'éléments"
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
                    {filters.map(({placeholder, filterBy}) => (
                        availableFilterValues[filterBy]?.length > 0 && (
                            <Select
                                key={filterBy}
                                placeholder={placeholder}
                                selectedKeys={selectedFilters[filterBy] || new Set()}
                                onSelectionChange={(selected) => {
                                    setSelectedFilters(prev => ({
                                        ...prev,
                                        [filterBy]: selected
                                    }));
                                }}
                                variant="flat"
                                selectionMode="multiple"
                                className="max-w-xs"
                                aria-label={placeholder}
                                classNames={{
                                    value: "text-neutral-900 dark:text-neutral-100",
                                    placeholder: "text-neutral-500 dark:text-neutral-400",
                                    listbox: "text-neutral-900 dark:text-neutral-100",
                                    label: "text-neutral-800 dark:text-neutral-200",
                                    description: "text-neutral-500 dark:text-neutral-400"
                                }}
                            >
                                {availableFilterValues[filterBy].map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {statusMapping[value] || value}
                                    </SelectItem>
                                ))}
                            </Select>
                        )
                    ))}
                    <Tooltip content={"Rafraîchir les données"} color="foreground" size="sm" showArrow
                             placement="top-end">
                        <Button
                            isIconOnly={true}
                            variant="flat"
                            isLoading={isLoading}
                            radius="full"
                            color="primary"
                            onPress={() => refreshData([model])}
                            aria-label="Rafraîchir les données"
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
                            aria-label="Supprimer les éléments sélectionnés"
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
                                    aria-label="Créer un nouvel élément"
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
                {paginatedItems && paginatedItems.length > 0 ? (
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
                            {columnsGreatNames.map((item, index) => {
                                // On cible la colonne 'Nom' (clé 'name')
                                const isNameCol = item === 'Nom';
                                return (
                                    <TableColumn
                                        key={index}
                                        align="left"
                                        className="text-content-primary dark:text-dark-content-primary cursor-pointer select-none"
                                        onClick={isNameCol ? () => setSortConfig(prev => ({
                                            key: 'name',
                                            direction: prev.key === 'name' && prev.direction === 'asc' ? 'desc' : 'asc'
                                        })) : undefined}
                                    >
                                        {item}
                                        {isNameCol && sortConfig.key === 'name' && (
                                            sortConfig.direction === 'asc' ?
                                                <ChevronUpIcon className="inline w-4 h-4 ml-1"/> :
                                                <ChevronDownIcon className="inline w-4 h-4 ml-1"/>
                                        )}
                                    </TableColumn>
                                );
                            })}
                            <TableColumn key="actions" align="right"
                                         className="text-content-primary dark:text-dark-content-primary">
                                {"<>"}
                            </TableColumn>
                        </TableHeader>
                        <TableBody>
                            {paginatedItems.map((item, index) => {
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
                                            <div className="flex items-center gap-2">
                                                {/* Bouton Consulter (bouton pour admin seulement) */}
                                                {model === "entry" && session?.user?.role !== 'USER' && (
                                                    <Tooltip content="Consulter la réservation" color="foreground"
                                                             showArrow>
                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            variant="flat"
                                                            color="default"
                                                            onPress={() => handleConsultEntry(item)}
                                                            className="text-neutral-600 dark:text-neutral-400"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                                                 viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth={2}
                                                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth={2}
                                                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                            </svg>
                                                        </Button>
                                                    </Tooltip>
                                                )}

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
                                            </div>
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

            {/* Modal de consultation des réservations */}
            {selectedEntry && (
                <ModalCheckingBooking
                    entry={selectedEntry}
                    adminMode={session?.user?.role !== 'USER'}
                    handleRefresh={() => refreshData([model])}
                    isOpen={isConsultModalOpen}
                    onOpenChange={setIsConsultModalOpen}
                />
            )}
        </div>
    );

}
