import {ProgressDemo} from "@/components/ui/progress";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import React, {useState} from "react";
import {PlusCircleIcon, TrashIcon} from "@heroicons/react/24/solid";
import {ArrowPathIcon, ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, XMarkIcon} from "@heroicons/react/24/outline";
import {HandHelping, ShieldX} from "lucide-react";
import {useMutation} from "@tanstack/react-query";
import ActionMenuModerate from "@/components/actions/ActionMenu";
import {useSession} from "next-auth/react";
import EntryDTO from "@/components/utils/DTO";
import PopupDoubleCheckAction from "@/components/modals/PopupDoubleCheckAction";
import {addToast} from "@/lib/toast";
import {useRefreshContext} from "@/features/shared/context/RefreshContext";
import {IoMdGlobe} from "react-icons/io";
import {MdOutlineCategory} from "react-icons/md";
import {truncateString} from "@/global";
import ActionOnItem from "@/components/actions/ActionOnItem";
import {BsInfoCircle} from "react-icons/bs";
import ModalCheckingBooking from "@/components/modals/ModalCheckingBooking";
import {getCategoryIcon} from "@/lib/category-icons";


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

const colorToBadgeVariant = (color) => {
    if (color === "success") return "success";
    if (color === "warning") return "warning";
    if (color === "danger") return "danger";
    return "neutral";
};

const Chip = ({children, color = "default", className}) => (
    <Badge variant={colorToBadgeVariant(color)} className={className}>
        {children}
    </Badge>
);

const AppTooltip = ({content, children}) => (
    <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
    </Tooltip>
);

const adminButtonClass = "border border-input bg-background text-foreground shadow-sm hover:bg-muted";
const adminIconButtonClass = `${adminButtonClass} h-10 w-10`;
const createButtonClass = "border border-neutral-950 bg-neutral-950 text-white shadow-sm hover:bg-neutral-800 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200";
const tableBorderClass = "border-neutral-300 dark:border-neutral-700";
const tableSurfaceClass = "bg-card text-card-foreground";

const InfoPopover = ({title = "Description", description, ariaLabel = "Afficher la description"}) => (
    <Popover>
        <PopoverTrigger asChild>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                aria-label={ariaLabel}
            >
                <BsInfoCircle className="h-4 w-4"/>
            </Button>
        </PopoverTrigger>
        <PopoverContent className="max-h-80 w-80 overflow-y-auto whitespace-pre-wrap break-words" align="start">
            {title && <div className="mb-1 font-semibold">{title}</div>}
            <div className="text-sm text-muted-foreground">{description || "Aucune description disponible."}</div>
        </PopoverContent>
    </Popover>
);

const ProtectionHoverCard = ({title, description}) => (
    <InfoPopover title={title} description={description} ariaLabel="Afficher le détail du niveau de protection"/>
);

const getProtection = (item) => item?.pickable || item?.category?.pickable || item?.domains?.pickable;

const getOwner = (item) => item?.owner || item?.category?.owner || item?.domains?.owner;

const formatFullPersonName = (person) => {
    if (!person) return "-";
    return [person.name, person.surname].filter(Boolean).join(" ") || person.username || person.email || "-";
};

const TextCell = ({value}) => (
    <span className="block max-w-56 truncate" title={String(value ?? "")}>
        {value}
    </span>
);

const CodeCell = ({value}) => (
    <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
        {value}
    </code>
);

const PickableCell = ({item, itemDTO}) => {
    if (itemDTO.pickable) {
        return (
            <div className="flex justify-start items-center w-full space-x-1">
                <Chip className="capitalize" color="warning" size="sm" variant="flat">
                    {itemDTO.pickable?.distinguishedName}
                </Chip>
                <ProtectionHoverCard title={itemDTO.pickable?.distinguishedName} description={itemDTO.pickable.description}/>
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
                <ProtectionHoverCard title={item.pickable.distinguishedName} description={item.pickable.description}/>
            </div>
        );
    }
    
    if (item?.category?.pickable) {
        return (
            <div className="flex justify-start items-center w-full space-x-1">
                <AppTooltip content="Hérite de sa catégorie">
                    <Chip className="capitalize" color="warning" size="sm" variant="flat">
                        <span className="flex flex-row justify-center items-center">
                            {item.category.pickable.distinguishedName}
                            <MdOutlineCategory className='ml-2'/>
                        </span>
                    </Chip>
                </AppTooltip>
                <ProtectionHoverCard title={item.category.pickable.distinguishedName} description={item.category.pickable.description}/>
            </div>
        );
    }

    if (item?.domains?.pickable) {
        return (
            <div className="flex justify-start items-center w-full space-x-1">
                <AppTooltip content="Hérite de son site">
                    <Chip className="capitalize" color="warning" size="sm" variant="flat">
                        <span className="flex flex-row justify-center items-center space-x-2">
                            {item.domains.pickable.distinguishedName}
                            <IoMdGlobe/>
                        </span>
                    </Chip>
                </AppTooltip>
                <ProtectionHoverCard title={item.domains.pickable.distinguishedName} description={item.domains.pickable.description}/>
            </div>
        );
    }

    return <EmptyCell/>;
};

const OwnerCell = ({item, itemDTO}) => {
    if (itemDTO.owner?.name) {
        return (
            <span className="block max-w-32 truncate" title={formatFullPersonName(itemDTO.owner)}>
                {displayPersonName(itemDTO.owner)}
            </span>
        );
    }

    if (item?.category?.owner?.name) {
        return (
            <AppTooltip content="Hérite de sa catégorie">
                <span className="flex max-w-32 items-center gap-1 truncate" title={formatFullPersonName(item.category.owner)}>
                    <span className="truncate">{displayPersonName(item.category.owner)}</span>
                    <MdOutlineCategory/>
                </span>
            </AppTooltip>
        );
    }

    if (item?.domains?.owner?.name) {
        return (
            <AppTooltip content="Hérite de son site">
                <span className="flex max-w-32 items-center gap-1 truncate" title={formatFullPersonName(item.domains.owner)}>
                    <span className="truncate">{displayPersonName(item.domains.owner)}</span>
                    <IoMdGlobe/>
                </span>
            </AppTooltip>
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

const formatCompactDateTime = (value) => new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
});

const formatCompactSlot = (entry) => {
    const start = new Date(entry.startDate);
    const end = new Date(entry.endDate);
    const sameDay = start.toDateString() === end.toDateString();
    const startLabel = formatCompactDateTime(start);
    const endLabel = sameDay
        ? end.toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})
        : formatCompactDateTime(end);

    return `${startLabel}${sameDay ? "-" : " → "}${endLabel}`;
};

const EntryDetailsPopover = ({entry}) => {
    const user = entry?.user;
    const resource = entry?.resource;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    aria-label={`Voir les détails de la réservation ${entry?.id || ""}`.trim()}
                >
                    <BsInfoCircle className="h-4 w-4"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 max-w-[calc(100vw-2rem)] space-y-3" align="start">
                <div>
                    <div className="font-semibold">Réservation #{entry?.id}</div>
                    <div className="text-xs text-muted-foreground">Détails de la réservation</div>
                </div>
                <div className="space-y-2 text-sm">
                    <DetailRow label="Statut" value={statusMapping[entry?.moderate] || entry?.moderate || "-"}/>
                    <DetailRow label="Début" value={entry?.startDate ? new Date(entry.startDate).toLocaleString("fr-FR") : "-"}/>
                    <DetailRow label="Fin" value={entry?.endDate ? new Date(entry.endDate).toLocaleString("fr-FR") : "-"}/>
                    <DetailRow label="Modification" value={entry?.lastUpdatedModerateStatus ? new Date(entry.lastUpdatedModerateStatus).toLocaleString("fr-FR") : "-"}/>
                    <DetailRow label="Restitué" value={entry?.returned ? "Oui" : "Non"}/>
                    <DetailRow label="Code" value={entry?.returnedConfirmationCode || "-"}/>
                    <DetailRow label="Série" value={Number(entry?.recurringGroupId || 0) > 0 ? `Réservations liées #${entry.recurringGroupId}` : "Non"}/>
                    <DetailRow label="Utilisateur" value={formatFullPersonName(user)}/>
                    <DetailRow label="Ressource" value={resource?.name || "-"}/>
                    <DetailRow label="Commentaire" value={entry?.comment || "-"}/>
                    <DetailRow label="Note admin" value={entry?.adminNote || "-"}/>
                </div>
            </PopoverContent>
        </Popover>
    );
};

const EntrySlotCell = ({entry}) => {
    const isRecurringGroup = Number(entry?.recurringGroupId || 0) > 0;

    return (
        <span className="flex min-w-0 max-w-52 items-center gap-2">
            <span className="min-w-0 truncate" title={`${new Date(entry.startDate).toLocaleString("fr-FR")} - ${new Date(entry.endDate).toLocaleString("fr-FR")}`}>
                {formatCompactSlot(entry)}
            </span>
            {isRecurringGroup && (
                <AppTooltip content="Réservation récurrente liée aux autres créneaux de la série">
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        Série
                    </span>
                </AppTooltip>
            )}
        </span>
    );
};

const EntryResourceCell = ({entry}) => (
    <div className="flex min-w-0 max-w-52 items-center gap-2">
        <span className="min-w-0 truncate" title={entry?.resource?.name}>{entry?.resource?.name || "-"}</span>
        <EntryDetailsPopover entry={entry}/>
    </div>
);

const EntryCodeCell = ({value}) => value ? <CodeCell value={value}/> : <EmptyCell/>;

const DescriptionCell = ({value}) => {
    if (!value) return <EmptyCell/>;

    return (
        <span className="flex max-w-72 items-center gap-2">
            <span className="min-w-0 truncate">{truncateString(value, 35)}</span>
            <InfoPopover description={value}/>
        </span>
    );
};

const displayPersonName = (person) => {
    if (!person) return "";
    const firstInitial = person.name ? `${person.name[0].toUpperCase()}.` : "";
    return [firstInitial, person.surname].filter(Boolean).join(" ") || person.username || person.email || "";
};

const ResourceDetailsPopover = ({item}) => {
    const protection = getProtection(item);
    const owner = getOwner(item);
    const confirmationText = item?.moderate
        ? "Réservation soumise à validation"
        : "Réservation libre, sans validation admin";

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    aria-label={`Voir les détails de ${item?.name || "la ressource"}`}
                >
                    <BsInfoCircle className="h-4 w-4"/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 max-w-[calc(100vw-2rem)] space-y-3" align="start">
                <div>
                    <div className="font-semibold">{item?.name}</div>
                    <div className="text-xs text-muted-foreground">Détails de la ressource</div>
                </div>
                <div className="space-y-2 text-sm">
                    <DetailRow label="Description" value={item?.description || "Aucune description"}/>
                    <DetailRow label="Protection" value={protection?.distinguishedName || "Aucune"}/>
                    <DetailRow label="Propriétaire" value={formatFullPersonName(owner)}/>
                    <DetailRow label="Confirmation" value={confirmationText}/>
                    <DetailRow label="Site" value={item?.domains?.name || "-"}/>
                    <DetailRow label="Catégorie" value={item?.category?.name || "-"}/>
                </div>
            </PopoverContent>
        </Popover>
    );
};

const DetailRow = ({label, value}) => (
    <div className="grid grid-cols-[7rem_1fr] gap-3">
        <span className="text-muted-foreground">{label}</span>
        <span className="break-words font-medium">{value}</span>
    </div>
);

const ResourceNameCell = ({item}) => (
    <div className="flex min-w-0 max-w-56 items-center gap-2">
        <ResourceStatusDotCell status={item?.status}/>
        <span className="min-w-0 truncate" title={item?.name}>{item?.name}</span>
        <ResourceDetailsPopover item={item}/>
    </div>
);

const ResourceModerateCell = ({value}) => (
    <AppTooltip content={value ? "Réservation soumise à validation" : "Réservation libre"}>
        <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                value
                    ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            }`}
            aria-label={value ? "Confirmation requise" : "Confirmation non requise"}
        >
            {value ? <ShieldX className="h-4 w-4" /> : <HandHelping className="h-4 w-4" />}
        </span>
    </AppTooltip>
);

const ResourceCategoryIconCell = ({category}) => {
    const {Icon} = getCategoryIcon(category?.iconKey);

    return (
        <AppTooltip content={category?.name || "Catégorie"}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-800">
                {category?.iconSvg ? <span className="h-5 w-5" dangerouslySetInnerHTML={{__html: category.iconSvg}} /> : <Icon className="h-5 w-5" />}
            </span>
        </AppTooltip>
    );
};

const CategoryIconCell = ({category}) => {
    const {Icon} = getCategoryIcon(category?.iconKey);

    return (
        <AppTooltip content={category?.iconKey || "Icône par défaut"}>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border">
                {category?.iconSvg ? <span className="h-5 w-5" dangerouslySetInnerHTML={{__html: category.iconSvg}} /> : <Icon className="h-5 w-5" />}
            </span>
        </AppTooltip>
    );
};

const CategoryNameCell = ({category}) => (
    <div className="flex min-w-0 items-center gap-3">
        <CategoryIconCell category={category}/>
        <span className="block min-w-0 truncate" title={category?.name}>{category?.name || '-'}</span>
    </div>
);

const ResourceStatusDotCell = ({status}) => (
    <AppTooltip content={status === "AVAILABLE" ? "Disponible" : "Indisponible"}>
        <span className={`inline-flex h-3 w-3 rounded-full ${status === "AVAILABLE" ? "bg-emerald-500" : "bg-red-500"}`} />
    </AppTooltip>
);

const ResourceProtectionCell = ({item}) => {
    const protection = getProtection(item);
    const inheritedFrom = item?.pickable ? null : item?.category?.pickable ? "catégorie" : item?.domains?.pickable ? "site" : null;

    if (!protection) return <EmptyCell/>;

    return (
        <div className="flex justify-start items-center w-full space-x-1">
            <AppTooltip content={inheritedFrom ? `Hérite de sa ${inheritedFrom}` : "Niveau défini sur la ressource"}>
                <Chip className="capitalize" color="warning" size="sm" variant="flat">
                    <span className="flex flex-row justify-center items-center">
                        {protection.distinguishedName}
                        {inheritedFrom === "catégorie" && <MdOutlineCategory className="ml-2"/>}
                        {inheritedFrom === "site" && <IoMdGlobe className="ml-2"/>}
                    </span>
                </Chip>
            </AppTooltip>
            <ProtectionHoverCard title={protection.distinguishedName} description={protection.description}/>
        </div>
    );
};

const ObjectCell = ({value, item}) => {
    if (!value || typeof value !== 'object') return <EmptyCell/>;

    // Si l'objet a une propriété name, on l'affiche
    if (value.name) {
        return (
            <span className="block max-w-40 truncate" title={value.surname ? `${value.name} ${value.surname}` : value.name}>
                {value.surname ? displayPersonName(value) : value.name}
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
                    <ProtectionHoverCard title={value.distinguishedName} description={value.description}/>
                )}
            </div>
        );
    }

    // Pour les autres objets, on affiche une représentation JSON
    return (
        <AppTooltip content={JSON.stringify(value, null, 2)}>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {Object.keys(value).length} propriétés
            </span>
        </AppTooltip>
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

    if (model === "resources" && key === "name") {
        return <ResourceNameCell item={item}/>;
    }

    if (model === "resources" && key === "moderate") {
        return <ResourceModerateCell value={itemDTO[key]}/>;
    }

    if (model === "resources" && key === "categoryIcon") {
        return <ResourceCategoryIconCell category={item.category}/>;
    }

    if (model === "resources" && key === "statusDot") {
        return <ResourceStatusDotCell status={item.status}/>;
    }

    if (model === "resources" && key === "pickable") {
        return <ResourceProtectionCell item={item}/>;
    }

    if (model === "categories" && key === "iconKey") {
        return <CategoryIconCell category={item}/>;
    }

    if (model === "categories" && key === "name") {
        return <CategoryNameCell category={item}/>;
    }

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
            <span className="block max-w-36 truncate" title={`${itemDTO[key].name || ""} ${itemDTO[key].surname || ""}`.trim()}>
                {displayPersonName(itemDTO[key])}
            </span>
        );
    }

    if (key === "resource" && itemDTO[key]) {
        return (
            <span className="block max-w-44 truncate" title={itemDTO[key].name}>
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

const getEntryDisplayKeys = (variant) => variant === "waiting"
    ? ["slot", "user", "resource"]
    : ["moderate", "slot", "user", "resource", "returnedConfirmationCode"];

const getResourceDisplayKeys = () => ["categoryIcon", "name", "moderate", "owner", "pickable"];

const renderEntryCell = (key, entry) => {
    if (key === "slot") return <EntrySlotCell entry={entry}/>;
    if (key === "resource") return <EntryResourceCell entry={entry}/>;
    if (key === "user") {
        return (
            <span className="block max-w-36 truncate" title={formatFullPersonName(entry.user)}>
                {displayPersonName(entry.user) || "-"}
            </span>
        );
    }
    if (key === "moderate") return <ModerateCell value={entry.moderate}/>;
    if (key === "returnedConfirmationCode") return <EntryCodeCell value={entry.returnedConfirmationCode}/>;
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
                                          filters = [],
                                          variant,
                                          showRefresh = true,
                                          refreshPlacement = 'filters'
}) {
    const [isOpenOnItem, setIsOpenOnItem] = useState(false);
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

        if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
            filtered.sort((a, b) => {
                const aTime = new Date(a[sortConfig.key]).getTime();
                const bTime = new Date(b[sortConfig.key]).getTime();
                return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
            });
        }

        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginated = filtered.slice(start, end);

        return {filteredItems: filtered, paginatedItems: paginated};
    }, [items, searchValue, page, filter, searchByArray, selectedFilters, sortConfig]);

    const totalItems = filteredItems.length;
    const pages = Math.ceil(totalItems / rowsPerPage);
    React.useEffect(() => {
        if (pages > 0 && page > pages) setPage(pages);
    }, [page, pages]);
    const visiblePages = Array.from({length: pages}, (_, index) => index + 1).filter((pageNumber) => (
        pageNumber === 1 ||
        pageNumber === pages ||
        Math.abs(pageNumber - page) <= 2
    ));

    const [isOpenDeleteConfirm, setIsOpenDeleteConfirm] = useState(false);
    const {data: session} = useSession();
    const [selectedItems, setSelectedItems] = useState(new Set());
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

    const RefreshButton = () => (
        <AppTooltip content="Rafraîchir les données">
            <Button size="icon" variant="default" className={adminIconButtonClass} disabled={isLoading} onClick={() => refreshData([model])} aria-label="Rafraîchir les données">
                <ArrowPathIcon width={20} height={20}/>
            </Button>
        </AppTooltip>
    );

    return (
        <TooltipProvider>
        <div className="mx-5 flex-1 relative">
            <div className="flex row justify-start items-center">
                <div className="flex flex-row space-x-2">
                    <div className="flex justify-center items-center">
                        <h1 className="text-2xl my-3 text-foreground">{name}</h1>
                    </div>
                    <div className="flex justify-center items-center">
                        <Button
                            size="icon"
                            disabled
                            aria-label="Nombre total d'éléments"
                        >
                            {items?.length ? items?.length : "0"}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                <div className="flex w-full flex-wrap items-center gap-4">
                    <div className="relative min-w-[min(20rem,100%)] flex-1">
                        <MagnifyingGlassIcon
                            width={20}
                            height={20}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            className="h-11 border border-input bg-background pl-10 pr-10 text-base text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        {searchValue && (
                            <button type="button" onClick={() => setSearchValue('')} className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-100" aria-label="Réinitialiser la recherche">
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    {showRefresh && refreshPlacement === 'search' && <RefreshButton />}
                    {!create_hidden && (
                        <AppTooltip content="Créer un nouvel élément">
                            <Button
                                variant="default"
                                onClick={() => {
                                    setCurrentAction("create");
                                    setIsOpenOnItem(true);
                                }}
                                className={createButtonClass}
                                aria-label="Créer un nouvel élément"
                            >
                                Créer
                                <PlusCircleIcon height={24} width={24}/>
                            </Button>
                        </AppTooltip>
                    )}
                </div>

                <div className="flex w-full flex-wrap items-center gap-4">
                    <div className="flex flex-1 flex-wrap items-center gap-4">
                        {filters.map(({placeholder, filterBy}) => (
                            availableFilterValues[filterBy]?.length > 0 && (
                                <Select
                                    key={filterBy}
                                    value={Array.from(selectedFilters[filterBy] || ["__all"])[0] || "__all"}
                                    onValueChange={(selected) => {
                                        const currentValue = Array.from(selectedFilters[filterBy] || ["__all"])[0] || "__all";
                                        if (currentValue === selected) return;
                                        setSelectedFilters(prev => ({
                                            ...prev,
                                            [filterBy]: selected === "__all" ? new Set() : new Set([selected])
                                        }));
                                    }}
                                >
                                    <SelectTrigger className="h-11 min-w-64 border border-input bg-background text-foreground shadow-sm hover:bg-muted" aria-label={placeholder}>
                                        <SelectValue placeholder={placeholder}/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all">{placeholder}</SelectItem>
                                        {availableFilterValues[filterBy].map((value) => (
                                            <SelectItem key={value} value={value}>
                                                {statusMapping[value] || value}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )
                        ))}
                    </div>
                    <div className="ml-auto flex flex-wrap items-center justify-end gap-4">
                        {model === 'entry' && (
                            <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                                <Button type="button" variant="ghost" size="sm" className={sortConfig.key === 'startDate' ? 'bg-muted font-bold' : ''} onClick={() => setSortConfig((previous) => ({key: 'startDate', direction: previous.key === 'startDate' && previous.direction === 'asc' ? 'desc' : 'asc'}))}>
                                    Début
                                    {sortConfig.key === 'startDate' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="ml-1 h-4 w-4" /> : <ChevronDownIcon className="ml-1 h-4 w-4" />)}
                                </Button>
                                <Button type="button" variant="ghost" size="sm" className={sortConfig.key === 'endDate' ? 'bg-muted font-bold' : ''} onClick={() => setSortConfig((previous) => ({key: 'endDate', direction: previous.key === 'endDate' && previous.direction === 'asc' ? 'desc' : 'asc'}))}>
                                    Fin
                                    {sortConfig.key === 'endDate' && (sortConfig.direction === 'asc' ? <ChevronUpIcon className="ml-1 h-4 w-4" /> : <ChevronDownIcon className="ml-1 h-4 w-4" />)}
                                </Button>
                            </div>
                        )}
                        {showRefresh && refreshPlacement === 'filters' && <RefreshButton />}

                        {showRefresh && refreshPlacement === 'filters' && selectionMode && <div className="h-8 w-px bg-border" />}
                        {selectionMode && selectedItems.size > 0 && (
                            <Button
                                size="icon"
                                variant="default"
                                className={adminIconButtonClass}
                                disabled={isLoading}
                                onClick={() => setIsOpenDeleteConfirm(true)}
                                aria-label="Supprimer les éléments sélectionnés"
                            >
                                <TrashIcon width={20} height={20}/>
                            </Button>
                        )}
                        <PopupDoubleCheckAction
                            onConfirm={handleDeleteItem}
                            isOpen={isOpenDeleteConfirm}
                            onOpenChange={setIsOpenDeleteConfirm}
                            title="Confirmation de suppression"
                            message={`Voulez-vous vraiment supprimer ${
                                selectedItems.size > 1 ? selectedItems.size : "cet"
                            } élément ?`}
                        />
                        {selectionMode && (
                            <div className="flex shrink-0 items-center whitespace-nowrap text-xs uppercase text-black dark:text-white">
                                {selectedItems.size <= 1
                                    ? selectedItems.size + " selectionné"
                                    : selectedItems.size + " selectionnés"}
                            </div>
                        )}
                    </div>
                    {items && (
                        <ActionOnItem
                            model={model}
                            formFields={formFields}
                            isOpen={isOpenOnItem}
                            onOpenChange={setIsOpenOnItem}
                            action={currentAction}
                            defaultValues={currentAction === "edit" ? currentItem : null}
                        />
                    )}
                </div>
            </div>
            {isLoading ? (
                <div className="mt-2 flex min-h-64 w-full items-center justify-center rounded-lg border bg-card">
                    <ProgressDemo />
                </div>
            ) : paginatedItems && paginatedItems.length > 0 ? (
                    <div className={`mt-2 overflow-hidden rounded-lg border ${tableBorderClass} ${tableSurfaceClass}`}>
                        <div className="max-h-[1000px] min-h-[222px] overflow-y-auto overflow-x-auto">
                            <table className={`w-full caption-bottom text-sm ${tableSurfaceClass}`} aria-label="Rows actions table example with dynamic content">
                                <thead className={`sticky top-0 z-10 border-b ${tableBorderClass} ${tableSurfaceClass}`}>
                                <tr>
                                    {selectionMode && (
                                        <th className="h-10 w-10 px-3 text-left align-middle">
                                            <Checkbox
                                                aria-label="Sélectionner tous les éléments de la page"
                                                checked={paginatedItems.every(item => selectedItems.has(item.id))}
                                                onCheckedChange={(checked) => {
                                                    setSelectedItems(prev => {
                                                        const next = new Set(prev);
                                                        paginatedItems.forEach(item => {
                                                            if (checked) next.add(item.id);
                                                            else next.delete(item.id);
                                                        });
                                                        return next;
                                                    });
                                                }}
                                            />
                                        </th>
                                    )}
                                    {columnsGreatNames.map((item, index) => {
                                        const isNameCol = item === 'Nom';
                                        const sortKey = isNameCol ? 'name' : model === 'entry' && item === 'Créneau' ? 'startDate' : null;
                                        return (
                                            <th
                                                key={index}
                                                className={`h-10 px-4 text-left align-middle font-medium text-foreground select-none ${sortKey ? 'cursor-pointer' : ''}`}
                                                onClick={sortKey ? () => setSortConfig(prev => ({
                                                    key: sortKey,
                                                    direction: prev.key === sortKey && prev.direction === 'asc' ? 'desc' : 'asc'
                                                })) : undefined}
                                            >
                                                {item}
                                                {sortKey && sortConfig.key === sortKey && (
                                                    sortConfig.direction === 'asc' ?
                                                        <ChevronUpIcon className="inline w-4 h-4 ml-1"/> :
                                                        <ChevronDownIcon className="inline w-4 h-4 ml-1"/>
                                                )}
                                            </th>
                                        );
                                    })}
                                    <th className={`sticky right-0 z-20 h-10 px-4 text-right align-middle font-medium text-foreground ${tableSurfaceClass}`}>
                                        {"<>"}
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedItems.map((item) => {
                                    const itemDTO = EntryDTO(item, filter);
                                    const rowKeys = model === "entry" ? getEntryDisplayKeys(variant) : Object.keys(itemDTO);
                                    return (
                                        <tr key={item.id} className={`border-b ${tableSurfaceClass} transition-colors hover:bg-neutral-50 last:border-0 dark:hover:bg-neutral-800/70 ${tableBorderClass}`}>
                                            {selectionMode && (
                                                <td className="p-3 align-middle">
                                                    <Checkbox
                                                        aria-label={`Sélectionner ${item.name || item.id}`}
                                                        checked={selectedItems.has(item.id)}
                                                        onCheckedChange={(checked) => {
                                                            setSelectedItems(prev => {
                                                                const next = new Set(prev);
                                                                if (checked) next.add(item.id);
                                                                else next.delete(item.id);
                                                                return next;
                                                            });
                                                        }}
                                                    />
                                                </td>
                                            )}
                                            {(model === "resources" ? getResourceDisplayKeys() : rowKeys).map((key) => (
                                                <td key={key} className="p-4 align-middle text-foreground">
                                                    {model === "entry" ? renderEntryCell(key, item) : renderCell(key, itemDTO, item, model)}
                                                </td>
                                            ))}
                                            <td className={`sticky right-0 p-4 align-middle text-foreground ${tableSurfaceClass}`}>
                                                <div className="flex items-center justify-end gap-2">
                                                    {model === "entry" && session?.user?.role !== 'USER' && (
                                                        <AppTooltip content="Consulter la réservation">
                                                            <Button
                                                                size="icon"
                                                                 variant="default"
                                                                 onClick={() => handleConsultEntry(item)}
                                                                 className={adminIconButtonClass}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                                </svg>
                                                            </Button>
                                                        </AppTooltip>
                                                    )}

                                                    <ActionMenuModerate
                                                        handleRefresh={() => refreshData([model])}
                                                        actions={actions}
                                                        onActionDelete={() => {
                                                            setSelectedItems(new Set([item.id]));
                                                            setIsOpenDeleteConfirm(true);
                                                        }}
                                                        onActionEdit={() => {
                                                            setCurrentAction("edit");
                                                            setCurrentItem(item);
                                                            setIsOpenOnItem(true);
                                                        }}
                                                        entry={item}
                                                        isOpen={isOpenDeleteConfirm}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                        <div className={`flex w-full items-center justify-center gap-2 border-t p-3 ${tableBorderClass}`}>
                            <Button variant="default" className={adminButtonClass} size="sm" disabled={page <= 1} onClick={() => setPage(prev => Math.max(prev - 1, 1))}>Précédent</Button>
                            {visiblePages.map((pageNumber, index) => (
                                <React.Fragment key={pageNumber}>
                                    {index > 0 && pageNumber - visiblePages[index - 1] > 1 && <span className="px-1 text-muted-foreground">...</span>}
                                    <Button
                                        variant="default"
                                        className={pageNumber === page ? "border border-neutral-400 bg-neutral-100 text-neutral-950 shadow-sm hover:bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700" : adminButtonClass}
                                        size="sm"
                                        onClick={() => setPage(pageNumber)}
                                    >
                                        {pageNumber}
                                    </Button>
                                </React.Fragment>
                            ))}
                            <Button variant="default" className={adminButtonClass} size="sm" disabled={page >= pages} onClick={() => setPage(prev => Math.min(prev + 1, pages))}>Suivant</Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center items-center mt-10 text-slate-600">
                        <p>Aucun éléments à afficher</p>
                    </div>
                )}

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
        </TooltipProvider>
    );

}
