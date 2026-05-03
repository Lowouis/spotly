import ModalCheckingBooking from "@/components/modals/ModalCheckingBooking";
import ModalCancelGroup from "@/components/modals/ModalCancelGroup";
import ModalSystemBooking from "@/components/modals/ModalSystemBooking";
import {formatDuration} from "@/global";
import {Button} from "@/components/ui/button";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {useEffect, useMemo, useRef, useState} from "react";
import {
    ArrowPathIcon,
    CalendarDaysIcon,
    ChevronRightIcon,
    ClockIcon,
    FunnelIcon,
    HandRaisedIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import {useRouter, useSearchParams} from "next/navigation";
import {getAutomaticReservationPhase} from "@/services/client/reservationModes";
import {getCategoryIcon} from "@/lib/category-icons";
import {addToast} from "@/lib/toast";


const STATUS_CONFIG = {
    waiting: {
        label: "En attente",
        color: "bg-amber-600",
        text: "En attente",
        dot: "bg-orange-400",
        chip: "bg-orange-50 text-orange-600",
        section: "bg-orange-400"
    },
    ended: {
        label: "Terminé",
        color: "bg-slate-600",
        dot: "bg-slate-400",
        chip: "bg-slate-100 text-slate-600",
        section: "bg-slate-400",
        text: (entry) => `${getAutomaticReservationPhase(entry) === 'ended' ? 'Terminé' : 'Rendu'} le ${new Date(getAutomaticReservationPhase(entry) === 'ended' ? entry.endDate : entry.updatedAt).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "2-digit",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })}`
    },
    delayed: {
        label: "En retard",
        color: "bg-red-600",
        dot: "bg-red-500",
        chip: "bg-red-50 text-red-600",
        section: "bg-red-500",
        text: (entry) => {
            const diff = new Date() - new Date(entry.endDate);
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `En retard de ${hours}h${minutes}min`;
        },
        hasPing: true
    },
    blocked: {
        label: "Bloqué",
        color: "bg-red-800",
        text: "Bloquée"
    },
    upcoming: {
        label: "À venir",
        color: "bg-blue-600",
        dot: "bg-blue-500",
        chip: "bg-blue-50 text-blue-600",
        section: "bg-blue-500",
        text: (entry) => `À venir le ${new Date(entry.startDate).toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "2-digit",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })}`
    },
    begin: {
        label: "Disponible",
        color: "bg-green-600",
        text: "Disponible",
        dot: "bg-emerald-500",
        chip: "bg-emerald-50 text-emerald-600",
        section: "bg-emerald-500"
    },
    ongoing: {
        label: "En cours",
        color: "bg-emerald-600",
        text: "En cours d'utilisation",
        dot: "bg-emerald-500",
        chip: "bg-emerald-50 text-emerald-600",
        section: "bg-emerald-500",
        hasPing: true
    },
    expired: {
        label: "Expiré",
        color: "bg-red-800",
        text: "Expirée",
        dot: "bg-red-300",
        chip: "bg-red-50 text-red-500",
        section: "bg-red-300"
    },
    rejected: {
        label: "Rejeté",
        color: "bg-red-500",
        text: "Rejetée",
        dot: "bg-rose-200",
        chip: "bg-rose-50 text-rose-500",
        section: "bg-rose-200"
    }
};


const getEntryStatus = (entry) => {
    if (entry.moderate === "REJECTED") return "rejected";
    if (entry.moderate === "BLOCKED") return "blocked";
    if (entry.moderate === "WAITING") return "waiting";
    const automaticPhase = getAutomaticReservationPhase(entry);
    if (automaticPhase) return automaticPhase;
    if (entry.moderate === "ACCEPTED" && entry.startDate > new Date().toISOString()) return "upcoming";
    if (entry.moderate === "ENDED" && entry.returned) return "ended";
    if (entry.endDate < new Date().toISOString() && !entry.returned && entry.moderate === "USED") return "delayed";
    if (entry.moderate === "USED") return "ongoing";
    if (entry.endDate <= new Date().toISOString() && entry.moderate === "ACCEPTED") return "expired";
    return "begin";
};

const startOfDayValue = (date) => {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
};

const getCurrentOrNextRecurringEntry = (entries, now = new Date()) => {
    const sortedEntries = [...(entries || [])].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const today = startOfDayValue(now);
    const todayEntry = sortedEntries.find((entry) => startOfDayValue(entry.startDate).getTime() === today.getTime());
    if (todayEntry) return todayEntry;

    const nextDayEntry = sortedEntries.find((entry) => startOfDayValue(entry.startDate) > today);
    return nextDayEntry || sortedEntries[sortedEntries.length - 1] || null;
};

const TimelineStepper = ({items, hiddenCount}) => (
    <div className="grid w-full max-w-[520px] grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3" aria-hidden="true">
        <div className="grid w-full items-end" style={{gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`}}>
            {items.map((item) => (
                <span key={item.id} className="min-w-0 truncate px-1 text-center text-xs font-black text-[#111827] dark:text-neutral-100">
                    {item.label}
                </span>
            ))}
        </div>
        {hiddenCount > 0 && <span className="row-span-2 flex h-10 w-14 items-center justify-center self-center rounded-full bg-slate-100 text-base font-black text-[#111827] dark:bg-neutral-900 dark:text-neutral-100">+{hiddenCount}</span>}
        <div className="grid w-full items-center" style={{gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`}}>
            {items.map((item, index) => (
                <div key={item.id} className="relative flex items-center justify-center">
                    {index < items.length - 1 && (
                        <span className={`absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full ${item.state === "completed" ? "bg-rose-300" : "bg-slate-200 dark:bg-neutral-800"}`} />
                    )}
                    <span className={`relative z-10 shrink-0 rounded-full border-2 transition-all ${item.state === "completed" ? "size-4 border-rose-300 bg-rose-300" : ""} ${item.state === "active" ? "size-5 border-rose-400 bg-white shadow-[0_0_0_6px_rgba(251,113,133,0.14)]" : ""} ${item.state === "upcoming" ? "size-4 border-slate-300 bg-white dark:border-neutral-700 dark:bg-neutral-950" : ""}`} />
                </div>
            ))}
        </div>
    </div>
);

const EntryProgressStepper = ({items, activeStep}) => (
    <div className="w-full max-w-[300px] space-y-3" aria-hidden="true">
        <div className="grid w-full items-center" style={{gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`}}>
            {items.map((item, index) => (
                <div key={item.id} className="relative flex items-center justify-center">
                    {index < items.length - 1 && (
                        <span className={`absolute left-1/2 top-1/2 h-0.5 w-full -translate-y-1/2 rounded-full ${item.step < activeStep ? "bg-emerald-500" : "bg-[#d6dde8]"}`} />
                    )}
                    <span className={`relative z-10 size-3.5 shrink-0 rounded-full border-2 transition-colors ${item.step <= activeStep ? "border-emerald-500 bg-emerald-500" : "border-[#d6dde8] bg-white"}`} />
                </div>
            ))}
        </div>
        <div className="grid w-full gap-1 text-center" style={{gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`}}>
            {items.map((item) => (
                <span key={`${item.id}-title`} className="min-w-0 truncate text-xs font-medium text-[#7b8798] dark:text-neutral-500">{item.title}</span>
            ))}
            {items.map((item) => (
                <span key={`${item.id}-date`} className="min-w-0 truncate text-xs font-medium text-[#7b8798] dark:text-neutral-500">{item.date}</span>
            ))}
        </div>
    </div>
);


// Composant pour un groupe de réservations récurrentes
const RecurringGroup = ({entries, handleRefresh, setUserAlert, autoOpenId}) => {
    const sortedEntries = useMemo(() => [...(entries || [])].sort((a, b) =>
        new Date(a.startDate) - new Date(b.startDate)
    ), [entries]);
    const defaultRecurringEntry = getCurrentOrNextRecurringEntry(sortedEntries);
    const initialEntry = sortedEntries.find((entry) => entry.id === autoOpenId) || defaultRecurringEntry;
    const [isModalOpen, setIsModalOpen] = useState(autoOpenId ? sortedEntries.some((entry) => entry.id === autoOpenId) : false);
    const [selectedEntryId, setSelectedEntryId] = useState(initialEntry?.id ?? null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const shouldFocusCurrentOccurrenceRef = useRef(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedEntry = sortedEntries.find((entry) => entry.id === selectedEntryId) || initialEntry;

    useEffect(() => {
        if (!autoOpenId) return;
        const targetEntry = sortedEntries.find((entry) => entry.id === autoOpenId);
        if (!targetEntry) return;
        setSelectedEntryId(targetEntry.id);
        setIsModalOpen(true);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('resId');
        const queryString = newSearchParams.toString();
        router.replace(queryString ? `?${queryString}` : '?');
    }, [autoOpenId, router, searchParams, sortedEntries]);

    useEffect(() => {
        if (!isModalOpen || !shouldFocusCurrentOccurrenceRef.current) return;

        const targetEntry = getCurrentOrNextRecurringEntry(sortedEntries);
        if (targetEntry) {
            setSelectedEntryId(targetEntry.id);
        }
        shouldFocusCurrentOccurrenceRef.current = false;
    }, [isModalOpen, sortedEntries]);

    useEffect(() => {
        if (selectedEntry || !initialEntry) return;
        setSelectedEntryId(initialEntry.id);
    }, [initialEntry, selectedEntry]);

    const openCurrentOccurrenceDetails = () => {
        shouldFocusCurrentOccurrenceRef.current = true;
        const nextSelectedEntry = getCurrentOrNextRecurringEntry(sortedEntries);
        if (nextSelectedEntry) {
            setSelectedEntryId(nextSelectedEntry.id);
        }
        setIsModalOpen(true);
    };

    if (!sortedEntries.length || !selectedEntry) return null;

    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    const status = getRecurringGroupStatus(sortedEntries);
    const config = STATUS_CONFIG[status];
    const now = new Date();
    const today = startOfDayValue(now);
    const nextTimelineIndex = sortedEntries.findIndex((entry) => startOfDayValue(entry.startDate) >= today);
    const activeTimelineIndex = nextTimelineIndex === -1 ? sortedEntries.length - 1 : nextTimelineIndex;
    const visibleTimelineWindowStart = sortedEntries.length <= 4
        ? 0
        : activeTimelineIndex >= 3
            ? activeTimelineIndex
            : 0;
    const visibleTimelineEntries = sortedEntries.slice(visibleTimelineWindowStart, visibleTimelineWindowStart + 4);
    const hiddenTimelineCount = Math.max(0, sortedEntries.length - visibleTimelineEntries.length);
    const timelineItems = visibleTimelineEntries.map((entry, index) => {
        const entryDay = startOfDayValue(entry.startDate);
        const isActive = visibleTimelineWindowStart + index === activeTimelineIndex;

        return {
            id: entry.id,
            label: index === 0 ? formatTimelineDateTime(entry.startDate) : formatTimelineDate(entry.startDate),
            state: entryDay < today ? "completed" : isActive ? "active" : "upcoming",
        };
    });
    // Vérifier si toutes les réservations peuvent être annulées
    const canCancelGroup = sortedEntries.every(entry => {
        const status = getEntryStatus(entry);
        return !["delayed", "ongoing"].includes(status);
    });

    return (
        <>
            <div className="w-full overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-colors hover:bg-[#fbfcff] dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900">
                <div className="grid gap-4 xl:grid-cols-[minmax(280px,1.15fr)_minmax(420px,1fr)_minmax(130px,0.45fr)] xl:items-center">
                    <button type="button" onClick={openCurrentOccurrenceDetails} className="flex min-w-0 items-center gap-4 text-left">
                        <CategoryLogo category={firstEntry.resource?.category} />
                        <span className="min-w-0">
                            <span className="flex items-center gap-2">
                                <span className={`h-3 w-3 rounded-full ${config?.dot || config?.color || "bg-blue-500"}`} />
                                <span className="truncate text-base font-bold text-[#111827] dark:text-neutral-100 sm:text-lg">{firstEntry.resource?.name || 'Ressource inconnue'}</span>
                            </span>
                            <span className="mt-2 block truncate text-sm font-medium text-[#6b7585] dark:text-neutral-400">
                                {firstEntry.resource?.domains?.name || "Site non défini"} <span className="mx-2">•</span> {firstEntry.resource?.category?.name || "Catégorie non définie"}
                            </span>
                        </span>
                    </button>

                    <div className="min-w-0 px-2 py-2 text-sm text-[#111827] dark:text-neutral-100">
                        <div className="mb-4 flex items-center justify-between gap-3">
                        </div>

                        <TimelineStepper items={timelineItems} hiddenCount={hiddenTimelineCount} />
                    </div>

                    <div className="flex min-w-0 flex-col gap-3 xl:items-stretch">
                        <Button type="button" variant="outline" onClick={openCurrentOccurrenceDetails} className="h-10 justify-between rounded-xl border-[#d8e0ea] bg-white px-3 text-xs font-bold text-[#111827] hover:bg-[#f6f8fb] dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100">
                            Voir le détail
                            <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <ModalCheckingBooking
                entry={selectedEntry}
                groupEntries={sortedEntries}
                onGroupEntryChange={(nextEntry) => setSelectedEntryId(nextEntry?.id ?? null)}
                canCancelGroup={canCancelGroup}
                onCancelGroup={() => setIsCancelModalOpen(true)}
                handleRefresh={handleRefresh}
                setUserAlert={setUserAlert}
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
            />

            <ModalCancelGroup
                isOpen={isCancelModalOpen}
                onOpenChange={setIsCancelModalOpen}
                entries={sortedEntries}
                handleRefresh={handleRefresh}
            />
        </>
    );
};

const formatDateTimeShort = (date) => new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
});

const formatTimelineDate = (date) => new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short"
});

const formatTimelineDateTime = (date) => {
    const value = new Date(date);
    return `${formatTimelineDate(value)} • ${value.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
    })}`;
};

const formatDateShort = (date) => new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short"
});

const formatDateTimeCompact = (date) => {
    const value = new Date(date);
    const isCurrentYear = value.getFullYear() === new Date().getFullYear();

    return value.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        ...(!isCurrentYear && {year: "numeric"}),
        hour: "2-digit",
        minute: "2-digit"
    }).replace(",", " •");
};

const getRemainingText = (entry, status) => {
    const now = new Date();
    const start = new Date(entry.startDate);
    const end = new Date(entry.endDate);

    if (status === "ongoing") return `Temps restant ${formatDuration(Math.max(0, end - now))}`;
    if (status === "upcoming") return `Dans ${formatDuration(Math.max(0, start - now))}`;
    if (status === "delayed") return `En retard de ${formatDuration(Math.max(0, now - end))}`;
    if (status === "ended") return `Restituée le ${formatDateTimeShort(getAutomaticReservationPhase(entry) === 'ended' ? entry.endDate : entry.updatedAt)}`;
    return STATUS_CONFIG[status]?.label || "Réservation";
};

const getDurationLabel = (entry, status) => {
    const now = new Date();
    const start = new Date(entry.startDate);
    const end = new Date(entry.endDate);
    const duration = formatDuration(end - start);

    if (status === "ongoing") return `Temps restant : ${formatDuration(Math.max(0, end - now))}`;
    if (status === "upcoming") return `Dans ${formatDuration(Math.max(0, start - now))}`;
    if (status === "delayed") return `Retard : ${formatDuration(Math.max(0, now - end))}`;
    if (!duration) return null;
    return `Durée : ${duration}`;
};

const CategoryLogo = ({category}) => {
    const iconSvg = category?.iconSvg;
    const {Icon} = getCategoryIcon(category?.iconKey);

    return (
    <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 via-white to-slate-300 text-slate-500 shadow-inner dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-700 sm:h-24 sm:w-28">
        {iconSvg ? (
            <span className="flex h-10 w-10 items-center justify-center text-slate-600" dangerouslySetInnerHTML={{__html: iconSvg}} />
        ) : (
            <Icon className="h-9 w-9" />
        )}
        <span className="sr-only">{category?.name || "Catégorie"}</span>
    </div>
    );
};

const EntryItem = ({entry, handleRefresh, setUserAlert, isGrouped = false, isLast = false, autoOpenModal}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialModalAction, setInitialModalAction] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (autoOpenModal) {
            setIsModalOpen(true);
            // Supprime le paramètre resId de l'URL en utilisant le routeur Next.js
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('resId');
            router.replace(`?${newSearchParams.toString()}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoOpenModal]);

    if (!entry) return null;

    const status = getEntryStatus(entry);
    const config = STATUS_CONFIG[status];
    if (!config) return null;

    const startDate = new Date(entry.startDate);
    const endDate = new Date(entry.endDate);
    const progressStep = status === "upcoming" || status === "waiting" || status === "begin" ? 0 : status === "ended" ? 2 : 1;
    const progressItems = [
        {id: "reserved", step: 1, title: "Réservée", date: formatDateShort(entry.createdAt || entry.startDate)},
        {
            id: "current",
            step: 2,
            title: status === "upcoming" ? "Débute" : status === "ended" ? "Utilisée" : "En cours",
            date: status === "upcoming" ? formatDateTimeShort(entry.startDate) : status === "ongoing" ? "Aujourd'hui" : formatDateShort(entry.startDate),
        },
        {id: "end", step: 3, title: "Fin", date: formatDateShort(entry.endDate)},
    ];
    const durationLabel = getDurationLabel(entry, status);
    const canOpenPickup = entry.moderate === "ACCEPTED" && endDate > new Date() && entry.resource?.status === "AVAILABLE";
    const canDeleteForCleanup = ["ended", "expired", "rejected"].includes(status);
    const actionLabel = status === "ongoing" || status === "delayed" ? "Restituer" : canOpenPickup ? "Récupérer" : "Modifier";
    const ActionIcon = status === "ongoing" || status === "delayed" ? ArrowPathIcon : canOpenPickup ? HandRaisedIcon : PencilIcon;

    const handleDeleteForCleanup = async () => {
        if (isDeleting) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/entry`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({ids: [entry.id]}),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || 'Erreur lors de la suppression');
            }

            addToast({
                title: "Réservation supprimée",
                description: "La réservation a été supprimée de votre historique.",
                color: "success",
                timeout: 4000,
            });
            handleRefresh();
        } catch (error) {
            console.error('Erreur suppression réservation:', error);
            addToast({
                title: "Erreur lors de la suppression",
                description: error.message || "Impossible de supprimer cette réservation.",
                color: "danger",
                timeout: 5000,
            });
        } finally {
            setIsDeleting(false);
        }
    };


    const detailButtonLabel = entry.system ? "Voir l'indisponibilité" : "Voir le détail";

    return (
        <div className={`w-full overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm transition-colors hover:bg-[#fbfcff] dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900 ${isGrouped && !isLast ? 'rounded-none border-x-0 border-t-0 shadow-none' : ''}`}>
            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(280px,1.35fr)_minmax(340px,1.1fr)_minmax(220px,0.85fr)_minmax(130px,0.45fr)] xl:items-center">
                <button type="button" onClick={() => setIsModalOpen(true)} className="flex min-w-0 items-center gap-4 text-left">
                    <CategoryLogo category={entry.resource?.category} />
                    <span className="min-w-0">
                        <span className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${config.dot || config.color}`} />
                            <span className="truncate text-base font-bold text-[#111827] dark:text-neutral-100 sm:text-lg">{entry.resource?.name || 'Ressource inconnue'}</span>
                        </span>
                        <span className="mt-2 block truncate text-sm font-medium text-[#6b7585] dark:text-neutral-400">
                            {entry.resource?.domains?.name || "Site non défini"} <span className="mx-2">•</span> {entry.resource?.category?.name || "Catégorie non définie"}
                        </span>
                    </span>
                </button>

                <div className="min-w-0 border-dashed border-[#d6dde8] text-[#5f6b7a] dark:border-neutral-800 xl:border-l xl:pl-5">
                    <div className="grid grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                        <CalendarDaysIcon className="mt-1.5 h-5 w-5 text-[#4b5563]" />
                        <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#8a94a6]">Départ</div>
                            <div className="mt-1 break-words text-[13px] font-bold leading-snug text-[#111827] dark:text-neutral-100 2xl:whitespace-nowrap 2xl:text-sm">{formatDateTimeCompact(entry.startDate)}</div>
                        </div>
                        <div className="min-w-0 border-l border-[#e2e8f0] pl-4 dark:border-neutral-800">
                            <div className="text-xs font-semibold text-[#8a94a6]">Arrivée</div>
                            <div className="mt-1 break-words text-[13px] font-bold leading-snug text-[#111827] dark:text-neutral-100 2xl:whitespace-nowrap 2xl:text-sm">{formatDateTimeCompact(entry.endDate)}</div>
                        </div>
                    </div>
                    {durationLabel && <div className="mt-3 border-t border-[#e2e8f0] pt-3 dark:border-neutral-800">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[#f1f3f6] px-3 py-1.5 text-xs font-bold text-[#5f6b7a] dark:bg-neutral-900 dark:text-neutral-300">
                            <ClockIcon className="h-4 w-4" />
                            {durationLabel}
                        </span>
                    </div>}
                </div>

                <div className="min-w-0 border-dashed border-[#d6dde8] dark:border-neutral-800 xl:border-l xl:pl-5">
                    <EntryProgressStepper items={progressItems} activeStep={progressStep + 1} />
                </div>

                <div className="flex min-w-0 flex-col gap-3 xl:items-stretch">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(true)} className="h-10 justify-between rounded-xl border-[#d8e0ea] bg-white px-3 text-xs font-bold text-[#111827] hover:bg-[#f6f8fb] dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100">
                        {detailButtonLabel}
                        <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                    {!entry.system && (canDeleteForCleanup ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleDeleteForCleanup}
                            disabled={isDeleting}
                            className="h-10 rounded-xl border-red-300 px-3 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                            {isDeleting ? "Suppression..." : "Supprimer"}
                            <TrashIcon className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setInitialModalAction(canOpenPickup ? "pickup" : null);
                                setIsModalOpen(true);
                            }}
                            className={`h-10 rounded-xl px-3 text-xs font-bold ${status === "ongoing" || status === "delayed" ? "border-red-300 text-red-600 hover:bg-red-50" : "border-blue-300 text-blue-600 hover:bg-blue-50"}`}
                        >
                            {actionLabel}
                            <ActionIcon className="h-4 w-4" />
                        </Button>
                    ))}
                </div>

                {entry.system ? (
                    <ModalSystemBooking
                        entry={entry}
                        isOpen={isModalOpen}
                        onOpenChange={setIsModalOpen}
                        handleRefresh={handleRefresh}
                    />
                ) : (
                    <ModalCheckingBooking
                        entry={entry}
                        handleRefresh={handleRefresh}
                        setUserAlert={setUserAlert}
                        isOpen={isModalOpen}
                        onOpenChange={(open) => {
                            setIsModalOpen(open);
                            if (!open) setInitialModalAction(null);
                        }}
                        initialAction={initialModalAction}
                    />
                )}
            </div>
        </div>
    );
};


const organizeEntriesByGroup = (entries) => {
    const grouped = {
        independent: [],
        recurring: {}
    };

    entries.forEach(entry => {
        if (!entry) return;
        if (entry.recurringGroupId === 0) {
            grouped.independent.push(entry);
        } else {
            if (!grouped.recurring[entry.recurringGroupId]) {
                grouped.recurring[entry.recurringGroupId] = [];
            }
            grouped.recurring[entry.recurringGroupId].push(entry);
        }
    });

    return grouped;
};

const GROUP_STATUS_PRIORITY = ["delayed", "ongoing", "waiting", "upcoming", "begin", "ended", "expired", "rejected", "blocked"];

const getRecurringGroupStatus = (entries) => {
    const statuses = new Set((entries || []).map(getEntryStatus));
    return GROUP_STATUS_PRIORITY.find((status) => statuses.has(status)) || "begin";
};

export default function ReservationUserListing({entries = [], handleRefresh, autoOpenResId}) {
    const statusNavRef = useRef(null);
    const [userAlert, setUserAlert] = useState({
        title: "",
        description: "",
        status: ""
    });

    const [selectedStatus, setSelectedStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [siteFilter, setSiteFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const resetToDefault = () => {
        setSelectedStatus("all");
        setSearchQuery("");
        setSiteFilter("all");
        setCategoryFilter("all");
    };

    const scrollStatusNav = (direction) => {
        statusNavRef.current?.scrollBy({
            left: direction * 260,
            behavior: "smooth",
        });
    };

    const getFilteredEntries = () => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return entries.filter(entry => {
            if (!entry) return false;
            const resourceName = entry.resource?.name?.toLowerCase() || "";
            const siteName = entry.resource?.domains?.name || "";
            const categoryName = entry.resource?.category?.name || "";

            if (siteFilter !== "all" && siteName !== siteFilter) return false;
            if (categoryFilter !== "all" && categoryName !== categoryFilter) return false;
            if (normalizedSearch && !resourceName.includes(normalizedSearch)) return false;

            return true;
        });
    };

    const filteredEntries = getFilteredEntries();
    const getDisplayUnits = (entries) => {
        const {independent, recurring} = organizeEntriesByGroup(entries);
        return [
            ...independent.map((entry) => ({type: "entry", id: `entry-${entry.id}`, status: getEntryStatus(entry), entry})),
            ...Object.entries(recurring).map(([groupId, groupEntries]) => ({
                type: "group",
                id: `group-${groupId}`,
                status: getRecurringGroupStatus(groupEntries),
                entries: groupEntries,
            })),
        ];
    };
    const displayUnits = getDisplayUnits(filteredEntries);
    const visibleDisplayUnits = selectedStatus === "all" ? displayUnits : displayUnits.filter((unit) => unit.status === selectedStatus);
    const entriesByStatus = displayUnits.reduce((acc, unit) => {
        acc[unit.status] = (acc[unit.status] || 0) + 1;
        return acc;
    }, {});
    const siteOptions = Array.from(new Set(entries.map(entry => entry?.resource?.domains?.name).filter(Boolean)));
    const categoryOptions = Array.from(new Set(entries.map(entry => entry?.resource?.category?.name).filter(Boolean)));

    const renderTabContent = () => {
        const renderUnits = (units) => {

            return (
                <div className="w-full space-y-4">
                    {units.map((unit) => {
                        if (unit.type === "entry") {
                            return (
                                <EntryItem
                                    key={unit.id}
                                    entry={unit.entry}
                                    handleRefresh={handleRefresh}
                                    setUserAlert={setUserAlert}
                                    autoOpenModal={autoOpenResId === unit.entry.id}
                                />
                            );
                        }

                        return (
                            <div key={unit.id} className="w-full space-y-4">
                                <RecurringGroup
                                    entries={unit.entries}
                                    handleRefresh={handleRefresh}
                                    setUserAlert={setUserAlert}
                                    autoOpenId={autoOpenResId}
                                />
                            </div>
                        );
                    })}
                </div>
            );
        };

        if (selectedStatus !== "all") return renderUnits(visibleDisplayUnits);

        const sectionOrder = ["ongoing", "upcoming", "waiting", "delayed", "begin", "ended", "expired", "rejected"];

        return (
            <div className="space-y-6">
                {sectionOrder.map((status) => {
                    const sectionUnits = visibleDisplayUnits.filter((unit) => unit.status === status);
                    if (!sectionUnits.length) return null;
                    const config = STATUS_CONFIG[status];

                    return (
                        <section key={status} className="space-y-3">
                            <h2 className="flex items-center gap-3 text-xl font-black text-[#111827] dark:text-neutral-100 md:text-2xl">
                                <span className={`h-7 w-1.5 rounded-full md:h-8 ${config.section || config.color}`} />
                                {config.label}
                                <span className="font-medium text-[#6b7585]">({sectionUnits.length})</span>
                            </h2>
                            {renderUnits(sectionUnits)}
                        </section>
                    );
                })}
            </div>
        );
    };

    const filterOptions = [
        {
            key: "all",
            label: "Toutes",
            color: "bg-red-500",
            count: displayUnits.length,
            icon: <ListBulletIcon className="h-5 w-5" />,
        },
        {
            key: "ongoing",
            label: "En cours",
            color: "bg-green-500",
            count: entriesByStatus.ongoing || 0
        },
        {
            key: "upcoming",
            label: "À venir",
            color: "bg-blue-500",
            count: entriesByStatus.upcoming || 0
        },
        {
            key: "begin",
            label: "Disponible",
            color: "bg-green-500",
            count: entriesByStatus.begin || 0
        },
        {
            key: "waiting",
            label: "En attente",
            color: "bg-amber-500",
            count: entriesByStatus.waiting || 0
        },
        {
            key: "delayed",
            label: "En retard",
            color: "bg-red-500",
            count: entriesByStatus.delayed || 0
        },
        {
            key: "ended",
            label: "Terminé",
            color: "bg-slate-500",
            count: entriesByStatus.ended || 0
        },
        {
            key: "expired",
            label: "Expiré",
            color: "bg-red-800",
            count: entriesByStatus.expired || 0
        },
        {
            key: "rejected",
            label: "Rejeté",
            color: "bg-red-500",
            count: entriesByStatus.rejected || 0
        }
    ];

    return (
        <TooltipProvider>
        <div className="mx-auto w-full max-w-[1600px]">
            {userAlert.title && (
                <div className="flex items-center justify-center w-full mb-4">
                    <div className="flex w-full items-start justify-between gap-3 rounded-md border bg-neutral-900 p-4 text-white dark:bg-neutral-100 dark:text-neutral-900">
                        <div>
                            <div className="font-semibold">{userAlert.title}</div>
                            <div className="text-sm opacity-90">{userAlert.description}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setUserAlert({title: "", description: "", status: ""})}
                            className="text-sm opacity-75 hover:opacity-100"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-7">
                <header>
                    <h1 className="text-3xl font-black tracking-tight text-[#111827] dark:text-neutral-100 md:text-4xl">Mes réservations</h1>
                    <p className="mt-2 text-base font-medium text-[#6b7585] dark:text-neutral-400 md:text-lg">Consultez, gérez et suivez toutes vos réservations de ressources.</p>
                </header>

                <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 rounded-2xl border border-[#e2e8f0] bg-white p-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                    <button
                        type="button"
                        onClick={() => scrollStatusNav(-1)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-xl font-bold text-[#4b5563] transition-colors hover:bg-[#f4f7fb] dark:text-neutral-300 dark:hover:bg-neutral-900"
                        aria-label="Voir les statuts précédents"
                    >
                        &lt;
                    </button>

                    <div ref={statusNavRef} className="flex min-w-0 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {filterOptions.map((filter) => {
                            const active = selectedStatus === filter.key;

                            return (
                                <button
                                    key={filter.key}
                                    type="button"
                                    onClick={() => setSelectedStatus(filter.key)}
                                    className={`group inline-flex h-11 shrink-0 items-center justify-between gap-3 rounded-xl px-4 text-sm font-bold transition-colors ${active ? "bg-[#111827] text-white shadow-sm" : "text-[#4b5563] hover:bg-[#f4f7fb] dark:text-neutral-300 dark:hover:bg-neutral-900"}`}
                                >
                                    <span className="flex items-center gap-2 whitespace-nowrap">
                                        {filter.icon ? <span className="shrink-0">{filter.icon}</span> : <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${filter.color}`} />}
                                        <span>{filter.label}</span>
                                    </span>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15 text-white" : "bg-[#eef1f5] text-[#111827] dark:bg-neutral-800 dark:text-neutral-100"}`}>{filter.count}</span>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => scrollStatusNav(1)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-xl font-bold text-[#4b5563] transition-colors hover:bg-[#f4f7fb] dark:text-neutral-300 dark:hover:bg-neutral-900"
                        aria-label="Voir les statuts suivants"
                    >
                        &gt;
                    </button>
                </div>

                <section className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_minmax(160px,1fr)_minmax(180px,1fr)_auto] xl:items-center">
                        <label className="relative block">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b8798]" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Rechercher une réservation..."
                                className="h-12 w-full rounded-xl border border-[#d8e0ea] bg-white pl-12 pr-4 text-sm font-medium text-[#111827] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 md:h-14 md:text-base"
                            />
                        </label>

                        <select value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)} className="h-12 min-w-0 rounded-xl border border-[#d8e0ea] bg-white px-4 text-sm font-medium text-[#3f4652] dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 md:h-14 md:text-base">
                            <option value="all">Tous les sites</option>
                            {siteOptions.map((site) => <option key={site} value={site}>{site}</option>)}
                        </select>

                        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-12 min-w-0 rounded-xl border border-[#d8e0ea] bg-white px-4 text-sm font-medium text-[#3f4652] dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 md:h-14 md:text-base">
                            <option value="all">Toutes les catégories</option>
                            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>

                        <Button type="button" variant="outline" onClick={resetToDefault} className="h-12 rounded-xl border-[#d8e0ea] px-4 text-sm font-bold text-[#3f4652] md:h-14 md:text-base">
                            <FunnelIcon className="h-5 w-5" />
                            Réinitialiser
                        </Button>
                    </div>
                </section>

                <section className="w-full">
                    {visibleDisplayUnits.length > 0 ? renderTabContent() : (
                        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-10 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                            <p className="text-lg font-bold text-[#111827] dark:text-neutral-100">Aucune réservation ne correspond aux filtres sélectionnés</p>
                            <button type="button" onClick={resetToDefault} className="mt-3 text-sm font-bold text-red-600 hover:underline">Réinitialiser les filtres</button>
                        </div>
                    )}
                </section>
            </div>
        </div>
        </TooltipProvider>
    );
}
