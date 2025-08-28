import ModalCheckingBooking from "@/components/modals/ModalCheckingBooking";
import ModalCancelGroup from "@/components/modals/ModalCancelGroup";
import ModalSystemBooking from "@/components/modals/ModalSystemBooking";
import {formatDuration} from "@/global";
import {Alert, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Tooltip} from "@heroui/react";
import {useEffect, useState} from "react";
import {TrashIcon} from "@heroicons/react/24/outline";
import {useRouter, useSearchParams} from "next/navigation";


const STATUS_CONFIG = {
    waiting: {
        label: "En attente",
        color: "bg-amber-600",
        text: "En attente"
    },
    ended: {
        label: "Terminé",
        color: "bg-slate-600",
        text: (entry) => `Rendu le ${new Date(entry.updatedAt).toLocaleDateString("fr-FR", {
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
        text: "Disponible"
    },
    ongoing: {
        label: "En cours",
        color: "bg-violet-800",
        text: "En cours d'utilisation",
        hasPing: true
    },
    expired: {
        label: "Expiré",
        color: "bg-red-800",
        text: "Expirée"
    },
    rejected: {
        label: "Rejeté",
        color: "bg-red-500",
        text: "Rejetée"
    }
};


const getEntryStatus = (entry) => {
    if (entry.moderate === "REJECTED") return "rejected";
    if (entry.moderate === "BLOCKED") return "blocked";
    if (entry.moderate === "WAITING") return "waiting";
    if (entry.moderate === "ACCEPTED" && entry.startDate > new Date().toISOString()) return "upcoming";
    if (entry.moderate === "ENDED" && entry.returned) return "ended";
    if (entry.endDate < new Date().toISOString() && !entry.returned && entry.moderate === "USED") return "delayed";
    if (entry.moderate === "USED") return "ongoing";
    if (entry.endDate <= new Date().toISOString() && entry.moderate === "ACCEPTED") return "expired";
    return "begin";
};


const StatusIndicator = ({status}) => {
    const config = STATUS_CONFIG[status];
    if (!config) return null;
    
    return (
        <div className="flex justify-center items-center relative w-3">
            <div className={`w-3 h-3 absolute ${config.color} rounded-full`}/>
            {config.hasPing && (
                <div className={`w-3 h-3 absolute ${config.color} rounded-full animate-ping opacity-75`}/>
            )}
        </div>
    );
};

// Composant pour un groupe de réservations récurrentes
const RecurringGroup = ({entries, handleRefresh, setUserAlert, currentTab = "all", autoOpenId}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    if (!entries?.length) return null;

    // Trier les entrées par date de début
    const sortedEntries = [...entries].sort((a, b) =>
        new Date(a.startDate) - new Date(b.startDate)
    );

    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];

    // Calculer la durée totale
    const totalDuration = sortedEntries.reduce((acc, entry) => {
        const start = new Date(entry.startDate);
        const end = new Date(entry.endDate);
        return acc + (end - start);
    }, 0);

    // Vérifier si toutes les réservations peuvent être annulées
    const canCancelGroup = currentTab === "all" && sortedEntries.every(entry => {
        const status = getEntryStatus(entry);
        return !["delayed", "ongoing"].includes(status);
    });

    return (
        <>
            <div
                className="w-full border border-neutral-200 dark:border-neutral-700 rounded-lg mb-4 overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
                <div
                    className="flex items-center justify-between px-4 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <div className="flex-1 flex justify-between items-center">
                        <div onClick={() => setIsOpen(!isOpen)}
                             className="flex-1 flex justify-between items-center cursor-pointer"
                             aria-expanded={isOpen}
                        >
                            <div className="flex flex-col items-start space-y-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                                        Réservations groupées
                                    </span>
                                    <span
                                        className="hidden sm:inline px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        {sortedEntries.length} réservation{sortedEntries.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div
                                    className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-content-secondary dark:text-dark-content-secondary">
                                    <span className="flex items-center">
                                        <svg
                                            className="w-4 h-4 mr-1.5 text-content-tertiary dark:text-dark-content-tertiary"
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                        </svg>
                                        Du {new Date(firstEntry.startDate).toLocaleDateString("fr-FR")} au {new Date(lastEntry.endDate).toLocaleDateString("fr-FR")}
                                    </span>
                                    <span className="hidden sm:flex items-center">
                                        <svg
                                            className="w-4 h-4 mr-1.5 text-content-tertiary dark:text-dark-content-tertiary"
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                        Durée totale : {formatDuration(totalDuration)}
                                    </span>
                                </div>
                            </div>
                            <svg
                                className={`w-6 h-6 transform transition-transform duration-200 text-neutral-500 dark:text-neutral-400 ${isOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                        {currentTab === "all" && (
                            <Tooltip
                                content={canCancelGroup ? "Annuler toutes les réservations du groupe" : "Impossible d'annuler le groupe, une réservation est en cours ou en retard"}
                                placement="top"
                                color="foreground"
                                showArrow={true}
                            >
                                <Button
                                    isIconOnly
                                    isDisabled={!canCancelGroup}
                                    color="danger"
                                    variant="light"
                                    size="sm"
                                    onPress={() => setIsCancelModalOpen(true)}
                                    className="ml-2"
                                >
                                    <TrashIcon className="w-5 h-5"/>
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {isOpen && (
                    <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {sortedEntries.map((entry, index) => (
                                <EntryItem
                                    key={entry.id}
                                    entry={entry}
                                    handleRefresh={handleRefresh}
                                    setUserAlert={setUserAlert}
                                    isGrouped={true}
                                    isLast={index === sortedEntries.length - 1}
                                    autoOpenModal={autoOpenId === entry.id}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <ModalCancelGroup
                isOpen={isCancelModalOpen}
                onOpenChange={setIsCancelModalOpen}
                entries={sortedEntries}
                handleRefresh={handleRefresh}
            />
        </>
    );
};

const getStatusText = (entry) => {
    const formatDateTime = (date) => {
        return date.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    switch (getEntryStatus(entry)) {
        case "waiting":
            return "En attente depuis le " + formatDateTime(new Date(entry.createdAt));
        case "ended":
            return `Terminée le ${formatDateTime(new Date(entry.updatedAt))}`;
        case "delayed":
            return "En retard";
        case "upcoming":
            return `À venir le ${formatDateTime(new Date(entry.startDate))}`;
        case "ongoing":
            return "En cours";
        case "expired":
            return "Expirée";
        case "rejected":
            return "Rejetée";
        default:
            return "";
    }
}

const EntryItem = ({entry, handleRefresh, setUserAlert, isGrouped = false, isLast = false, autoOpenModal}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
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
    const duration = endDate - startDate;


    const getDateDisplay = () => {


        const getStatusIcon = () => {
            switch (status) {
                case "upcoming":
                    return (
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                    );
                case "ended":
                    return (
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                        </svg>
                    );
                case "delayed":
                    return (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    );
                case "ongoing":
                    return (
                        <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    );
                case "waiting":
                    return (
                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    );
                default:
                    return (
                        <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    );
            }
        };

        return (
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                {getStatusIcon()}
                <span>
                    {getStatusText(entry)}
                </span>
                {status !== "ended" && status !== "waiting" && status !== "expired" && status !== "rejected" && status !== "upcoming" && (
                    <span className="ml-1 font-medium">{formatDuration(duration)}</span>
                )}
            </div>
        );
    };


    return (
        <div
            className={`w-full mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 cursor-pointer transition-colors duration-200
                ${isGrouped ? 'bg-white dark:bg-neutral-900' : 'bg-white dark:bg-neutral-900 rounded-lg mb-2 shadow-sm border border-neutral-200 dark:border-neutral-700'}
                ${!isLast && isGrouped ? 'border-b border-neutral-200 dark:border-neutral-700' : ''}
                hover:bg-neutral-50 dark:hover:bg-neutral-800`}
            onClick={() => setIsModalOpen(true)}
        >
            <div className="flex flex-col space-y-2 w-full sm:w-auto">
                <div className="flex items-center space-x-3">
                    <div className="text-lg font-semibold text-content-primary dark:text-dark-content-primary">
                        {entry.resource?.name || 'Ressource inconnue'}
                    </div>
                    <StatusIndicator status={status}/>
                    {entry.system && (
                        <div
                            className="px-2 py-0.5 bg-danger-100 dark:bg-danger-900/30 rounded-full text-xs font-medium text-danger-700 dark:text-danger-400">
                            Indisponible
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm">
                    {getDateDisplay()}

                </div>
            </div>

            <div className="mt-4 sm:mt-0">
                {entry.system && <Button
                    color="danger"
                    variant="light"
                    size="sm"
                    onPress={(e) => {
                        e.stopPropagation(); // Empêcher l'ouverture du modal principal
                        setIsModalOpen(true);
                    }}
                    className="font-medium"
                >
                    Voir l&apos;indisponibilité
                </Button>}

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
                        onOpenChange={setIsModalOpen}
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

export default function ReservationUserListing({entries = [], handleRefresh, autoOpenResId}) {
    const [userAlert, setUserAlert] = useState({
        title: "",
        description: "",
        status: ""
    });

    // Modal de nettoyage
    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
    const [isCleanupLoading, setIsCleanupLoading] = useState(false);

    // Système de filtres à cocher
    const [activeFilters, setActiveFilters] = useState({
        ongoing: true,    // En cours
        upcoming: true,   // À venir
        waiting: true,    // En attente
        ended: false,     // Terminé
        delayed: true,    // En retard
        expired: false,   // Expiré
        rejected: false   // Rejeté
    });

    // Toggle d'un filtre
    const toggleFilter = (filterKey) => {
        setActiveFilters(prev => ({
            ...prev,
            [filterKey]: !prev[filterKey]
        }));
    };

    // Réinitialiser aux filtres par défaut
    const resetToDefault = () => {
        setActiveFilters({
            ongoing: true,
            upcoming: true,
            waiting: true,
            ended: false,
            delayed: true,
            expired: false,
            rejected: false
        });
    };

    // Fonction de nettoyage des réservations terminées, refusées et expirées
    const handleCleanup = async () => {
        setIsCleanupLoading(true);
        try {
            // Récupérer les IDs des réservations à supprimer
            const entriesToDelete = entries.filter(entry => {
                if (!entry) return false;
                const status = getEntryStatus(entry);
                return ["ended", "expired", "rejected"].includes(status);
            }).map(entry => entry.id);

            if (entriesToDelete.length === 0) {
                setUserAlert({
                    title: "Aucune réservation à nettoyer",
                    description: "Toutes les réservations sont déjà à jour",
                    status: "warning"
                });
                return;
            }

            // Utiliser l'endpoint DELETE existant de /api/entry.js
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ids: entriesToDelete}),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                setUserAlert({
                    title: "Nettoyage réussi",
                    description: `${result.count} réservation(s) supprimée(s)`,
                    status: "success"
                });
                // Rafraîchir les données
                handleRefresh();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors du nettoyage');
            }
        } catch (error) {
            console.error('Erreur nettoyage:', error);
            setUserAlert({
                title: "Erreur lors du nettoyage",
                description: error.message || "Impossible de supprimer les réservations",
                status: "danger"
            });
        } finally {
            setIsCleanupLoading(false);
            // Fermer le modal dans tous les cas (succès ou erreur)
            setIsCleanupModalOpen(false);
        }
    };

    // Vérifier si un filtre est actif
    const isFilterActive = (filterKey) => activeFilters[filterKey];

    // Obtenir les entrées filtrées
    const getFilteredEntries = () => {
        return entries.filter(entry => {
            if (!entry) return false;
            const status = getEntryStatus(entry);
            return activeFilters[status] || false;
        });
    };

    const filteredEntries = getFilteredEntries();

    const renderTabContent = () => {
        const renderEntries = (entries) => {
            const {independent, recurring} = organizeEntriesByGroup(entries);

            return (
                <div className="w-full space-y-4">
                    {/* Afficher d'abord les entrées indépendantes */}
                    {independent.map(entry => (
                        <EntryItem
                            key={entry.id}
                            entry={entry}
                            handleRefresh={handleRefresh}
                            setUserAlert={setUserAlert}
                            autoOpenModal={autoOpenResId === entry.id}
                        />
                    ))}

                    {/* Puis afficher les groupes de réservations récurrentes */}
                    {Object.keys(recurring).length > 0 && (
                        <div className="w-full space-y-4">
                            {Object.entries(recurring).map(([groupId, groupEntries]) => (
                                <RecurringGroup
                                    key={groupId}
                                    entries={groupEntries}
                                    handleRefresh={handleRefresh}
                                    setUserAlert={setUserAlert}
                                    currentTab="all"
                                    autoOpenId={autoOpenResId}
                                />
                            ))}
                        </div>
                    )}
                </div>
            );
        };

        return renderEntries(filteredEntries);
    };

    // Configuration des filtres avec labels et couleurs
    const filterOptions = [
        {
            key: "ongoing",
            label: "En cours",
            color: "bg-green-500",
            count: entries.filter(e => getEntryStatus(e) === "ongoing").length
        },
        {
            key: "upcoming",
            label: "À venir",
            color: "bg-blue-500",
            count: entries.filter(e => getEntryStatus(e) === "upcoming").length
        },
        {
            key: "waiting",
            label: "En attente",
            color: "bg-amber-500",
            count: entries.filter(e => getEntryStatus(e) === "waiting").length
        },
        {
            key: "delayed",
            label: "En retard",
            color: "bg-red-500",
            count: entries.filter(e => getEntryStatus(e) === "delayed").length
        },
        {
            key: "ended",
            label: "Terminé",
            color: "bg-slate-500",
            count: entries.filter(e => getEntryStatus(e) === "ended").length
        },
        {
            key: "expired",
            label: "Expiré",
            color: "bg-red-800",
            count: entries.filter(e => getEntryStatus(e) === "expired").length
        },
        {
            key: "rejected",
            label: "Rejeté",
            color: "bg-red-500",
            count: entries.filter(e => getEntryStatus(e) === "rejected").length
        }
    ];

    return (
        <div className="mx-auto w-[90%] max-w-[1089px]">
            {userAlert.title && (
                <div className="flex items-center justify-center w-full mb-4">
                    <Alert
                        description={userAlert.description}
                        title={userAlert.title}
                        color={userAlert.status}
                        variant="solid"
                        onClose={() => setUserAlert({title: "", description: "", status: ""})}
                    />
                </div>
            )}

            {entries.length > 0 ? (
                <div className="w-full flex-col flex justify-between items-center">
                    {/* Filtres - Desktop avec checkboxes */}
                    <div className="w-full mb-6 hidden md:block">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                Filtres
                            </h3>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={resetToDefault}
                                    className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
                                >
                                    Réinitialiser
                                </button>
                                <button
                                    onClick={() => setIsCleanupModalOpen(true)}
                                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline"

                                >
                                    Nettoyer
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {filterOptions.map(filter => (
                                <label
                                    key={filter.key}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                                        isFilterActive(filter.key)
                                            ? 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800'
                                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-600'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isFilterActive(filter.key)}
                                        onChange={() => toggleFilter(filter.key)}
                                        className="sr-only"
                                    />
                                    <div
                                        className={`w-3 h-3 rounded-full ${filter.color} ${isFilterActive(filter.key) ? 'opacity-100' : 'opacity-30'}`}/>
                                    <span className={`text-sm font-medium ${
                                        isFilterActive(filter.key)
                                            ? 'text-neutral-900 dark:text-neutral-100'
                                            : 'text-neutral-600 dark:text-neutral-400'
                                    }`}>
                                        {filter.label}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        isFilterActive(filter.key)
                                            ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                                    }`}>
                                        {filter.count}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Filtres - Mobile avec select */}
                    <div className="w-full mb-6 mt-2 md:hidden">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                Filtres
                            </h3>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={resetToDefault}
                                    className="text-sm text-neutral-600 dark:text-neutral-400 underline"
                                >
                                    Réinitialiser
                                </button>
                                <button
                                    onClick={() => setIsCleanupModalOpen(true)}
                                    className="text-sm text-red-600 dark:text-red-400 "
                                >
                                    Nettoyer
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {filterOptions.map(filter => (
                                <label
                                    key={filter.key}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                                        isFilterActive(filter.key)
                                            ? 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800'
                                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isFilterActive(filter.key)}
                                        onChange={() => toggleFilter(filter.key)}
                                        className="sr-only"
                                    />
                                    <div
                                        className={`w-3 h-3 rounded-full ${filter.color} ${isFilterActive(filter.key) ? 'opacity-100' : 'opacity-30'}`}/>
                                    <span className={`text-sm font-medium ${
                                        isFilterActive(filter.key)
                                            ? 'text-neutral-900 dark:text-neutral-100'
                                            : 'text-neutral-600 dark:text-neutral-400'
                                    }`}>
                                        {filter.label}
                                    </span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ml-auto ${
                                        isFilterActive(filter.key)
                                            ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                                    }`}>
                                        {filter.count}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Résultats */}
                    <div className="w-full">
                        {filteredEntries.length > 0 ? (
                            <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                                {filteredEntries.length} réservation{filteredEntries.length > 1 ? 's' : ''} affichée{filteredEntries.length > 1 ? 's' : ''}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Aucune réservation ne correspond aux filtres sélectionnés
                                </p>
                                <button
                                    onClick={resetToDefault}
                                    className="mt-2 text-sm text-neutral-700 dark:text-neutral-300 underline hover:text-neutral-900 dark:hover:text-neutral-100"
                                >
                                    Réinitialiser les filtres
                                </button>
                            </div>
                        )}
                        {renderTabContent()}
                    </div>
                </div>
            ) : (
                <div className="flex justify-center items-center mt-4 p-3">
                    <h1 className="text-lg opacity-75 dark:text-neutral-300 text-neutral-600 text-center font-medium">
                        Aucune réservation
                    </h1>
                </div>
            )}

            {/* Modal de confirmation pour le nettoyage */}
            <Modal
                isOpen={isCleanupModalOpen}
                onOpenChange={setIsCleanupModalOpen}
                size="md"
                radius="lg"
                backdrop="blur"
                classNames={{
                    base: "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700",
                    header: "border-b border-neutral-200 dark:border-neutral-700 pb-4",
                    body: "py-6",
                    footer: "border-t border-neutral-200 dark:border-neutral-700"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-2">
                                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                    Nettoyer les réservations
                                </h2>
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
                                    <div
                                        className="flex items-center space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none"
                                             stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                                        </svg>
                                        <div className="text-sm text-amber-800 dark:text-amber-200">
                                            <p className="font-medium">Attention !</p>
                                            <p>Cette action est irréversible.</p>
                                        </div>
                                    </div>

                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                        <p className="font-medium mb-2">Réservations qui seront supprimées :</p>
                                        <ul className="space-y-1 ml-4">
                                            <li>• Réservations terminées</li>
                                            <li>• Réservations refusées</li>
                                            <li>• Réservations expirées</li>
                                        </ul>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="default"
                                    variant="bordered"
                                    onPress={onClose}
                                    className="border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    color="danger"
                                    variant="solid"
                                    onPress={handleCleanup}
                                    isDisabled={isCleanupLoading}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {isCleanupLoading ? "Nettoyage en cours..." : "Nettoyer"}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}



