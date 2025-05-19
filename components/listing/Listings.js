import ModalCheckingBooking from "@/components/modals/ModalCheckingBooking";
import ModalCancelGroup from "@/components/modals/ModalCancelGroup";
import ModalSystemBooking from "@/components/modals/ModalSystemBooking";
import {formatDuration} from "@/global";
import {Alert, Button} from "@nextui-org/react";
import {useState} from "react";
import {TrashIcon} from "@heroicons/react/24/outline";
import {Tooltip} from "@heroui/react";


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
const RecurringGroup = ({entries, handleRefresh, setUserAlert, currentTab = "all"}) => {
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
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex-1 flex justify-between items-center"
                        aria-expanded={isOpen}
                    >
                        <div className="flex flex-col items-start space-y-1">
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                                    Réservations groupées
                                </span>
                                <span
                                    className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-sm font-medium text-neutral-700 dark:text-neutral-300">
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
                                <span className="flex items-center">
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
                        <div className="flex items-center gap-2">
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
                                        className="mr-2"
                                    >
                                        <TrashIcon className="w-5 h-5"/>
                                    </Button>
                                </Tooltip>
                            )}


                            <svg
                                className={`w-6 h-6 transform transition-transform duration-200 text-neutral-500 dark:text-neutral-400 ${isOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                            </svg>
                        </div>
                    </button>
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

const EntryItem = ({entry, handleRefresh, setUserAlert, isGrouped = false, isLast = false}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                    <span className="ml-1 font-medium">({formatDuration(duration)})</span>
                )}
            </div>
        );
    };

    return (
        <div className={`w-full flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 
            ${isGrouped ? 'bg-white dark:bg-neutral-900' : 'bg-white dark:bg-neutral-900 rounded-lg mb-2 shadow-sm border border-neutral-200 dark:border-neutral-700'}
            ${!isLast && isGrouped ? 'border-b border-neutral-200 dark:border-neutral-700' : ''}`}>
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
                    onPress={() => setIsModalOpen(true)}
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

export default function ReservationUserListing({entries = [], handleRefresh}) {
    const [userAlert, setUserAlert] = useState({
        title: "",
        description: "",
        status: ""
    });

    const [selectedTab, setSelectedTab] = useState("all");


    const getSortedEntries = () => {
        const sorted = {
            waiting: [],
            ongoing: [],
            upcoming: [],
            ended: []
        };

        entries.forEach(entry => {
            if (!entry) return;

            const status = getEntryStatus(entry);
            if (status === "waiting") sorted.waiting.push(entry);
            else if (status === "upcoming") sorted.upcoming.push(entry);
            else if (status === "begin") sorted.ongoing.push(entry);
            else if (["ended", "expired", "rejected"].includes(status)) sorted.ended.push(entry);
            else sorted.ongoing.push(entry);
        });

        return sorted;
    };

    const sortedEntries = getSortedEntries();

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
                                    currentTab={selectedTab}
                                />
                            ))}
                        </div>
                    )}
                </div>
            );
        };

        switch (selectedTab) {
            case "all":
                return renderEntries(entries);
            case "ongoing":
                return renderEntries(sortedEntries.ongoing);
            case "coming":
                return renderEntries(sortedEntries.upcoming);
            case "awaiting":
                return renderEntries(sortedEntries.waiting);
            case "ended":
                return renderEntries(sortedEntries.ended);
            default:
                return null;
        }
    };

    const tabs = [
        {key: "all", label: "Toutes"},
        {
            key: "ongoing",
            label: "En cours",
            indicator: <div className="w-2 h-2 rounded-full bg-green-500 ml-2"/>
        },
        {
            key: "coming",
            label: "À venir",
            indicator: <div className="w-2 h-2 rounded-full bg-blue-500 ml-2"/>
        },
        {
            key: "awaiting",
            label: "En attente",
            indicator: <div className="w-2 h-2 rounded-full bg-amber-500 ml-2"/>
        },
        {
            key: "ended",
            label: "Terminé",
            indicator: <div className="w-2 h-2 rounded-full bg-red-500 ml-2"/>
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
                    <div className="w-full mb-4 flex justify-center">
                        <div
                            className="flex space-x-2 border-b border-neutral-200 dark:border-neutral-700 w-full overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setSelectedTab(tab.key)}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 flex items-center whitespace-nowrap ${
                                        selectedTab === tab.key
                                            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100"
                                            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                                    }`}
                                >
                                    {tab.label}
                                    {tab.indicator}
                                </button>
                            ))}
                        </div>
                    </div>
                    {renderTabContent()}
                </div>
            ) : (
                <div className="flex justify-center items-center mt-4 p-3">
                    <h1 className="text-lg opacity-75 dark:text-neutral-300 text-neutral-600 text-center font-medium">
                        Aucune réservation
                    </h1>
                </div>
            )}
        </div>
    );
}



