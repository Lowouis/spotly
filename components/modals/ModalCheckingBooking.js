import {Button} from "@/components/ui/button";
import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from "@/components/ui/combobox";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Spinner} from "@/components/ui/spinner";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import HourSelect from "@/components/form/HourSelect";
import ShadcnDatePicker, {dateToCalendarValue} from "@/components/form/ShadcnDatePicker";

import {
    ArrowLeftIcon,
    ArrowUturnLeftIcon,
    BellAlertIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    CubeIcon,
    EnvelopeIcon,
    HandRaisedIcon,
    PencilIcon,
    ShieldExclamationIcon,
    TrashIcon,
    UserGroupIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import React, {useCallback, useEffect, useState} from "react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {useEmail} from "@/features/shared/context/EmailContext";
import {addToast} from "@/lib/toast";
import {useEntryActions} from "@/hooks/useEntryActions";
import {useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import ResourceEventModal from "@/components/modals/ResourceEventModal";
import {
    canConfirmWithCode,
    getAutomaticReservationPhase,
    requiresPickupCode,
    requiresReturnCode
} from '@/services/client/reservationModes';

const ModalTooltip = ({content, children}) => (
    <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
    </Tooltip>
);


export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) + " " + new Date(date).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(':', 'h')
}

const ReturnDueDescription = ({targetDate, done}) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate) - new Date();

            if (difference <= 0) {
                setTimeLeft(null);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const parts = [];

            if (days > 0) parts.push(`${days}j`);
            if (hours > 0) parts.push(`${hours}h`);
            parts.push(`${minutes}m`);

            setTimeLeft(parts.join(' '));
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (done) return "La ressource a été restituée.";
    if (!timeLeft) return "Restitution attendue maintenant.";

    return <>Restitution attendue dans <span className="font-semibold text-neutral-800 dark:text-neutral-100">{timeLeft}</span>.</>;
};

// Hook partagé: compte les réservations avant la nôtre entre maintenant et le début
const useWaitlistCount = (entry) => {
    const now = new Date();
    const start = new Date(entry.startDate);
    const enabled = now < start && !!entry.resource?.id;
    const nowIso = now.toISOString();
    const startIso = start.toISOString();

    const {data, isLoading, isError} = useQuery({
        queryKey: ['waitlist', entry.resource?.id, startIso],
        enabled,
        refetchInterval: 60000,
        queryFn: async () => {
            const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?resourceId=${entry.resource?.id}&startDate=${encodeURIComponent(nowIso)}&endDate=${encodeURIComponent(startIso)}`;
            const res = await fetch(url, {credentials: 'include'});
            if (!res.ok) throw new Error('Erreur de récupération des réservations');
            const all = await res.json();
            const relevant = (all || []).filter(e => ['ACCEPTED', 'USED', 'WAITING'].includes(e.moderate) && e.id !== entry.id);
            return relevant.length;
        }
    });

    return {count: data ?? 0, enabled, isLoading, isError};
};

// Composant liste d'attente: nombre de réservations entre maintenant et la récupération
const WaitlistInfo = ({entry, isAble}) => {
    const {count, enabled, isLoading, isError} = useWaitlistCount(entry);
    if (!enabled || isError) return null;
    if (isLoading) return <Spinner size="sm" className="text-neutral-500" color="default"/>;
    if (count === 0 && !isAble) {
        return "Non disponible";
    }
    return (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-semibold">{count}</span> réservation{count > 1 ? 's' : ''} avant la vôtre
        </div>
    );
};

const formatShortDate = (date) => new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
});

const formatShortTime = (date) => new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
}).replace(':', 'h');

const TimelineNode = ({step, done, active, failed, last}) => (
    <div className="flex w-12 flex-col items-center">
        <div className={`${done ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : active ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/25' : failed ? 'border-red-500 bg-red-50 text-red-600' : 'border-neutral-300 bg-white text-neutral-500'} flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black dark:bg-neutral-950`}>
            {done ? <CheckIcon className="h-5 w-5"/> : step}
        </div>
        {!last && <div className={`${done || active ? 'bg-blue-500' : 'bg-neutral-200'} mt-2 h-full min-h-14 w-px`}/>}
    </div>
);

const StatusPill = ({children, tone = 'neutral'}) => {
    const toneClass = tone === 'green'
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900'
        : tone === 'blue'
            ? 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-900'
            : tone === 'red'
                ? 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900'
                : 'bg-neutral-100 text-neutral-700 ring-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-800';

    return <span className={`${toneClass} inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1`}>{children}</span>;
};

const StepMeta = ({icon: Icon, label, date, time}) => (
    <div className="grid min-w-44 grid-cols-[1.5rem_1fr] items-start gap-3 text-left">
        {Icon ? <Icon className="mt-1 h-5 w-5 text-neutral-500 dark:text-neutral-400"/> : <span/>}
        <div className="space-y-0.5">
            {label && <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">{label}</div>}
            {date && <div className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{date}</div>}
            {time && <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{time}</div>}
        </div>
    </div>
);

const BookingStepCard = ({step, title, description, metaIcon: MetaIcon, metaLabel, metaDate, metaTime, status, statusTone, done, active, failed, last, children}) => (
    <div className="grid grid-cols-[3rem_1fr] gap-3">
        <TimelineNode step={step} done={done} active={active} failed={failed} last={last}/>
        <section className={`${active ? 'border-blue-300 ring-2 ring-blue-100 dark:border-blue-700 dark:ring-blue-950' : 'border-neutral-200 dark:border-neutral-800'} rounded-2xl border bg-white p-4 shadow-sm dark:bg-neutral-950`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className={`${active ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-950 dark:text-neutral-50'} text-base font-bold`}>
                        {step}. {title}
                    </h3>
                    {description && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-start gap-3 sm:w-48">
                    {(metaLabel || metaDate || metaTime) && (
                        <StepMeta icon={MetaIcon} label={metaLabel} date={metaDate} time={metaTime}/>
                    )}
                    {status && <div className="pl-9"><StatusPill tone={statusTone}>{status}</StatusPill></div>}
                </div>
            </div>
            {children && <div className="mt-4">{children}</div>}
        </section>
    </div>
);

const InlineCodeEntry = ({title, description, email, otp, error, resendTimer, isSubmitting, confirmDisabled = false, confirmLabel = 'Valider le code', onOtpChange, onConfirm, onResend, onCancel}) => (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
        <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
                {title && <h4 className="font-bold text-neutral-950 dark:text-neutral-50">{title}</h4>}
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {description}{' '}
                    {email && <span className="font-semibold text-neutral-900 dark:text-neutral-100">{email}</span>}
                </p>
            </div>
            {onCancel && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onCancel} aria-label="Fermer la saisie du code">
                    <XMarkIcon className="h-4 w-4" />
                </Button>
            )}
        </div>
        {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
            </div>
        )}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
                value={otp}
                onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
                onPaste={(event) => {
                    event.preventDefault();
                    onOtpChange(event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6));
                }}
                inputMode="numeric"
                maxLength={6}
                name="confirmation_code"
                placeholder="000000"
                className="text-center text-lg tracking-[0.3em] sm:w-44"
            />
            <Button type="button" className="sm:min-w-40" disabled={otp.length !== 6 || confirmDisabled || isSubmitting} onClick={onConfirm}>
                {isSubmitting ? <><Spinner className="h-4 w-4" />Validation...</> : confirmLabel}
            </Button>
            <Button type="button" variant="outline" disabled={resendTimer > 0 || isSubmitting} onClick={onResend}>
                {resendTimer > 0 ? `Renvoyer dans ${resendTimer}s` : 'Renvoyer le code'}
            </Button>
        </div>
    </div>
);

function getConversationOwner(resource) {
    return resource?.owner || resource?.category?.owner || resource?.domains?.owner || null;
}

export default function ModalCheckingBooking({
                                                   entry,
                                                   adminMode = false,
                                                   handleRefresh,
                                                   isOpen: controlledIsOpen,
                                                   onOpenChange: controlledOnOpenChange,
                                                   setUserAlert,
                                                   initialAction = null,
                                                   groupEntries = [],
                                                   onGroupEntryChange,
                                                   canCancelGroup = false,
                                                   onCancelGroup
                                               }) {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);

    const isControlled = controlledIsOpen !== undefined;

    const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;
    const onOpenChange = isControlled ? controlledOnOpenChange : setUncontrolledIsOpen;
    const handleOpenChange = (open) => {
        if (!open) {
            setModalStepper("main");
            setOtp("");
            setError(null);
            setResendTimer(0);
        }
        onOpenChange?.(open);
    };

    const [otp, setOtp] = useState("");
    const [error, setError] = useState(null);
    const [resendTimer, setResendTimer] = useState(0);
    const [modalStepper, setModalStepper] = useState("main");
    const [isProblemReportOpen, setIsProblemReportOpen] = useState(false);
    const [isReportingBlocking, setIsReportingBlocking] = useState(false);
    const { mutate: sendEmail } = useEmail();
    const [warnSent, setWarnSent] = useState(false);

    // États pour la modification de réservation
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        startDate: null,
        endDate: null,
        startTime: null,
        endTime: null,
        resourceId: '',
        userId: ''
    });
    const [availabilityCheck, setAvailabilityCheck] = useState({
        isLoading: false,
        isAvailable: false,
        message: ''
    });
    const [availableResources, setAvailableResources] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const {data: session} = useSession();
    const router = useRouter();
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN';
    const hasConversation = Number(entry?._count?.messages || entry?.messages?.length || 0) > 0;
    const conversationOwner = getConversationOwner(entry?.resource);
    const conversationButtonLabel = hasConversation ? "Ouvrir la conversation" : conversationOwner ? "Envoyer un message" : null;
    const sortedGroupEntries = [...(groupEntries || [])].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const currentGroupIndex = sortedGroupEntries.findIndex((groupEntry) => groupEntry.id === entry?.id);
    const hasGroupNavigation = sortedGroupEntries.length > 1 && currentGroupIndex >= 0;
    const allowedGroupDates = new Set(sortedGroupEntries.map((groupEntry) => new Date(groupEntry.startDate).toDateString()));
    const selectGroupEntry = (nextEntry) => {
        if (!nextEntry) return;
        setModalStepper("main");
        setOtp("");
        setError(null);
        setResendTimer(0);
        onGroupEntryChange?.(nextEntry);
    };
    const selectGroupEntryByDate = (date) => {
        const nextEntry = sortedGroupEntries.find((groupEntry) => new Date(groupEntry.startDate).toDateString() === date?.toDateString());
        selectGroupEntry(nextEntry);
    };

    // Use the centralized hook
    const {
        timeScheduleOptions,
        isLoadingTSO,
        hasBlockingPrevious,
        isAbleToPickUp,
        isPickupLoading,
        isReturnLoading,
        pickupUnavailableReason,
        handlePickUp: hookHandlePickUp,
        handleReturn: hookHandleReturn
    } = useEntryActions(entry, null); // No clientIP needed for authenticated users

    // Reuse du comptage via hook partagé (évite la duplication de logique)
    const {count: waitlistCount, enabled: waitEnabled} = useWaitlistCount(entry);

    // Entrée précédente non restituée (si la ressource est indisponible à l'heure de départ)
    const nowForPrev = new Date();
    const startForPrev = new Date(entry.startDate);
    const prevEnabled = nowForPrev >= startForPrev && !!entry.resource?.id;
    const {data: previousNotReturned} = useQuery({
        queryKey: ['prev-not-returned', entry.resource?.id, startForPrev.toISOString()],
        enabled: prevEnabled,
        refetchInterval: 60000,
        queryFn: async () => {
            const since = new Date(startForPrev.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(); // fenêtre 30j avant le début
            const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?resourceId=${entry.resource?.id}&startDate=${encodeURIComponent(since)}&endDate=${encodeURIComponent(startForPrev.toISOString())}`;
            const res = await fetch(url, {credentials: 'include'});
            if (!res.ok) throw new Error('Erreur récupération précédente');
            const all = await res.json();
            // Garder les entrées terminées avant le début de la réservation courante et non restituées, en excluant l'entrée courante
            const candidates = (all || []).filter(e => new Date(e.endDate) < startForPrev && e.returned === false && e.id !== entry.id);
            if (candidates.length === 0) return null;
            // Prendre la plus récente
            candidates.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
            return candidates[0];
        }
    });



        
    const handlePickUp = async (onClose)=>{
        setError(null);
        setOtp("");
        if (!requiresPickupCode(entry)) {
            await hookHandlePickUp(onClose, handleRefresh);
        }
    }

    const handleReportBlocking = async () => {
        if (isReportingBlocking) return;
        setIsReportingBlocking(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/entry/${entry.id}/report-blocking`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.message || 'Signalement impossible');
            addToast({
                title: 'Blocage signalé',
                description: payload.emailSent ? 'L’utilisateur précédent et le gestionnaire ont été informés.' : 'Le gestionnaire a été informé.',
                color: 'success',
                timeout: 5000,
            });
            handleRefresh?.();
        } catch (error) {
            addToast({
                title: 'Signalement impossible',
                description: error.message || 'Impossible de signaler le blocage.',
                color: 'danger',
                timeout: 5000,
            });
        } finally {
            setIsReportingBlocking(false);
        }
    };

    useEffect(() => {
        if (!isOpen || initialAction !== "pickup") return;
        if (!localIsAbleToPickUp()) return;

        if (!requiresPickupCode(entry)) {
            hookHandlePickUp(() => handleOpenChange(false), handleRefresh);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialAction]);

    const handleReturn = async ()=>{
        setError(null);
        setOtp("");

        if (!requiresReturnCode(entry)) {
            await hookHandleReturn(null, handleRefresh);
        }
    }
    const automaticPhase = getAutomaticReservationPhase(entry);
    const isAutomaticOngoing = automaticPhase === 'ongoing';
    const isAutomaticEnded = automaticPhase === 'ended';

    const validDatesToPickup = () => {
        if (isLoadingTSO || !timeScheduleOptions) {
            return false;
        }
        const nowIso = new Date().toISOString();
        const regularAllowed = timeScheduleOptions.ajustedStartDate <= nowIso;
        const flexibleAllowed = timeScheduleOptions.maxEarlyPickupMinutes > 0
            && timeScheduleOptions.flexiblePickupStartDate <= nowIso
            && entry?.resource?.status === 'AVAILABLE'
            && (!waitEnabled || waitlistCount === 0);
        return regularAllowed || flexibleAllowed;
    }

    const updateEntryMutation = useMutation({
        mutationFn: async ({method, entry, updateData}) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${entry.id}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                ...(updateData && {body : JSON.stringify(updateData)}),
            });

            if (!response.ok) {
                throw new Error('Échec de la mise à jour');
            }

            return response.json();
        },
        onSuccess: () => {
            handleRefresh();
        },
        onError: () => {
            addToast({
                title: "Erreur",
                description : "La ressource n'as pas pu être modifié. Si le problème persiste contacter un administrateur.",
                timeout: 5000,
                color : "danger"
            });
        }
    });

    const handlePickUpUpdate = async () => {
        await updateEntryMutation.mutateAsync({
            entry,
            updateData: { moderate: "USED" },
            method : "PUT"
        });
        addToast({
            title: "Pick-up",
            description : "La récupèration de la ressource à bien été prise en compte.",
            timeout: 5000,
            color : "primary"
        });

        setModalStepper("main")
        setOtp("");
    }

    const handleReturnUpdate = async () => {
        await updateEntryMutation.mutateAsync({
            entry,
            updateData: { returned: true, moderate: "ENDED" },
            method : "PUT"
        });
        addToast({
            title: "Restitution",
            description : "La ressource à bien été retournée.",
            timeout: 5000,
            color : "success"
        });
        setModalStepper("main");
        setOtp("");
        sendEmail({
            to: entry.user.email,
            subject: "Confirmation de restitution - " + entry.resource.name,
            templateName: "reservationReturnedConfirmation",
            data : {
                resource: entry.resource,
                endDate: new Date(entry.endDate).toLocaleString("FR-fr", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric"
                }),
            }
        });
    }


    const handleDeleteEntry = () => {
        updateEntryMutation.mutate({
            entry,
            method : "DELETE"
        });
        sendEmail({
            to: entry.user.email,
            subject: "Confirmation de l'annulation de votre réservation Spotly - " + entry.resource.name,
            templateName: "reservationCancelled",
            data: {
                    user: entry.user.name + " " + entry.user.surname,
                    resource: entry.resource.name,
                    startDate: new Date(entry.startDate).toLocaleString("FR-fr", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric"
                    }),
                    endDate: new Date(entry.endDate).toLocaleString("FR-fr", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric"
                    }),
            }
        });
        setModalStepper("main")
        handleRefresh();
        addToast({
            title: "Annulation de réservation",
            description : "Votre réservation à bien été "+(adminMode ? "supprimer" : "annuler")+" avec succès.", status: "success",
            timeout: 5000,
            color: "success"
        });
    }

    const handleUpdateEntity = async (action) => {
        if(canConfirmWithCode(entry, otp)){
            try {
                if (action === "return") {
                    await handleReturnUpdate({entry});
                } else {
                    await handlePickUpUpdate({entry});
                }
            } catch {
                // The mutation already displays the error toast.
            }
        } else {
            setError("Le code ne correspond pas, veuillez réessayer");
        }
    };

    useEffect(() => {
        setOtp("");
        setError(null);
        setResendTimer(0);
    }, [entry?.id]);
    const handleOwnerReturn = (entry) => {
            if (entry.resource.owner !== null){
                return entry.resource.owner.name + " " + entry.resource.owner.surname;
            } else if(entry.resource.category.owner !== null) {
                return entry.resource.category.owner.name + " " + entry.resource.category.owner.surname;
            } else if(entry.resource.domains.owner !== null) {
                return entry.resource.domains.owner.name + " " + entry.resource.domains.owner.surname;
            } else {
                return null;
            }
    }

    // Fonction pour obtenir le nom de l'utilisateur sélectionné
    const getSelectedUserName = (userId) => {
        if (!userId) return '';
        const user = availableUsers.find(u => u.id.toString() === userId.toString());
        return user ? `${user.name} ${user.surname}` : '';
    };

    const setEditTime = (field, value) => {
        const time = new Date();
        time.setHours(parseInt(value), 0, 0, 0);
        setEditData(prev => ({...prev, [field]: time}));
    };

    // Fonction pour gérer le renvoi du code
    // Fonction pour initialiser les données d'édition
    const initializeEditData = () => {
        const startDate = new Date(entry.startDate);
        const endDate = new Date(entry.endDate);

        setEditData({
            startDate: startDate,
            endDate: endDate,
            startTime: startDate,
            endTime: endDate,
            resourceId: entry.resourceId?.toString() || '',
            userId: entry.userId?.toString() || ''
        });
        setIsEditing(true);
        setModalStepper("edit");
    };

    // Fonction pour charger les ressources disponibles
    const loadAvailableResources = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/resources?categoryId=${entry.resource.categoryId}&domainId=${entry.resource.domainId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const resources = await response.json();
                const availableOrCurrent = resources.filter(r => r.status === 'AVAILABLE' || r.id === entry.resourceId);
                setAvailableResources(availableOrCurrent);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des ressources:', error);
        }
    }, [entry.resource.categoryId, entry.resource.domainId, entry.resourceId]);

    // Fonction pour charger les utilisateurs (admin seulement)
    const loadAvailableUsers = useCallback(async () => {
        if (!isAdmin) return;

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/users`, {
                credentials: 'include'
            });
            if (response.ok) {
                const users = await response.json();
                setAvailableUsers(users);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
        }
    }, [isAdmin]);

    // Fonction pour vérifier la disponibilité
    const checkAvailability = useCallback(async () => {
        setAvailabilityCheck({isLoading: true, isAvailable: false, message: ''});

        try {
            // Combiner date et heure pour créer les dates complètes
            const startDateTime = editData.startDate && editData.startTime ?
                new Date(editData.startDate.getFullYear(), editData.startDate.getMonth(), editData.startDate.getDate(),
                    editData.startTime.getHours(), editData.startTime.getMinutes()) : null;
            const endDateTime = editData.endDate && editData.endTime ?
                new Date(editData.endDate.getFullYear(), editData.endDate.getMonth(), editData.endDate.getDate(),
                    editData.endTime.getHours(), editData.endTime.getMinutes()) : null;

            if (!startDateTime || !endDateTime) {
                setAvailabilityCheck({
                    isLoading: false,
                    isAvailable: false,
                    message: 'Veuillez sélectionner les dates et heures'
                });
                return;
            }

            // Vérification simplifiée : utiliser l'API de réservation
            const params = new URLSearchParams({
                startDate: startDateTime.toISOString(),
                endDate: endDateTime.toISOString(),
                categoryId: entry.resource.categoryId,
                domainId: entry.resource.domainId
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/reservation?${params}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const availableResources = await response.json();

                // Si on garde la même ressource, c'est toujours disponible
                if (editData.resourceId === entry.resourceId?.toString()) {
                    setAvailabilityCheck({
                        isLoading: false,
                        isAvailable: true,
                        message: 'Modification possible'
                    });
                } else {
                    // Vérifier si la nouvelle ressource sélectionnée est dans les ressources disponibles
                    const isAvailable = availableResources.some(r => r.id.toString() === editData.resourceId);

                    setAvailabilityCheck({
                        isLoading: false,
                        isAvailable,
                        message: isAvailable ? 'Modification possible' : 'Ressource indisponible sur ces horaires'
                    });
                }
            } else {
                setAvailabilityCheck({
                    isLoading: false,
                    isAvailable: false,
                    message: 'Erreur lors de la vérification'
                });
            }
        } catch (error) {
            console.error('Erreur de vérification:', error);
            setAvailabilityCheck({
                isLoading: false,
                isAvailable: false,
                message: 'Erreur de connexion'
            });
        }
    }, [editData, entry.resource.categoryId, entry.resource.domainId, entry.resourceId]);

    // Fonction pour appliquer les modifications
    const applyModifications = async () => {
        try {
            // Combiner date et heure pour créer les dates complètes
            const startDateTime = new Date(editData.startDate.getFullYear(), editData.startDate.getMonth(), editData.startDate.getDate(),
                editData.startTime.getHours(), editData.startTime.getMinutes());
            const endDateTime = new Date(editData.endDate.getFullYear(), editData.endDate.getMonth(), editData.endDate.getDate(),
                editData.endTime.getHours(), editData.endTime.getMinutes());

            const updateData = {
                startDate: startDateTime.toISOString(),
                endDate: endDateTime.toISOString(),
                resourceId: parseInt(editData.resourceId),
                ...(isAdmin && {userId: parseInt(editData.userId)})
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${entry.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
                credentials: 'include'
            });

            if (response.ok) {
                addToast({
                    title: "Modification réussie",
                    description: "La réservation a été modifiée avec succès",
                    color: "success",
                    timeout: 5000
                });

                setIsEditing(false);
                setModalStepper("main");
                handleRefresh();
            } else {
                throw new Error('Échec de la modification');
            }
        } catch (error) {
            addToast({
                title: "Erreur",
                description: "La modification a échoué",
                color: "danger",
                timeout: 5000
            });
        }
    };

    const sendReservationCodeEmail = useCallback(() => {
        if (!entry?.user?.email || !entry?.returnedConfirmationCode) return;

        sendEmail({
            to: entry.user.email,
            subject: "Code de réservation pour : " + entry.resource.name,
            templateName: "resentCode",
            data: {
                entryId: entry.id,
                user: entry.user.name + " " + entry.user.surname,
                resource: entry.resource.name,
                startDate: new Date(entry.startDate).toLocaleString("FR-fr", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric"
                }),
                endDate: new Date(entry.endDate).toLocaleString("FR-fr", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric"
                }),
                key : entry.returnedConfirmationCode
            }
        });
    }, [entry, sendEmail]);

    const handleResendCode = () => {
        if (resendTimer > 0) return;

        setResendTimer(30);
        sendReservationCodeEmail();
    };

    const localIsAbleToPickUp = () => {
        const resourceAvailable = entry?.resource?.status === 'AVAILABLE';
        const noQueue = waitEnabled ? (waitlistCount === 0) : true;
        return (entry.moderate === "ACCEPTED")
            && new Date(entry?.endDate) > new Date()
            && validDatesToPickup()
            && resourceAvailable
            && noQueue;
    }

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    // Charger les données quand on entre en mode édition
    useEffect(() => {
        if (modalStepper === "edit") {
            loadAvailableResources();
            if (isAdmin) {
                loadAvailableUsers();
            }
        }
    }, [modalStepper, isAdmin, loadAvailableResources, loadAvailableUsers]);

    // Vérifier la disponibilité quand les données changent
    useEffect(() => {
        if (modalStepper === "edit" && editData.startDate && editData.endDate && editData.startTime && editData.endTime && editData.resourceId) {
            // Vérifier que les dates sont valides
            const startDateTime = new Date(editData.startDate.getFullYear(), editData.startDate.getMonth(), editData.startDate.getDate(),
                editData.startTime.getHours(), editData.startTime.getMinutes());
            const endDateTime = new Date(editData.endDate.getFullYear(), editData.endDate.getMonth(), editData.endDate.getDate(),
                editData.endTime.getHours(), editData.endTime.getMinutes());

            if (startDateTime >= endDateTime) {
                setAvailabilityCheck({
                    isLoading: false,
                    isAvailable: false,
                    message: 'La date de fin doit être postérieure à la date de début'
                });
                return;
            }

            const timer = setTimeout(() => {
                checkAvailability();
            }, 500); // Délai pour éviter trop de requêtes
            return () => clearTimeout(timer);
        }
    }, [editData.startDate, editData.endDate, editData.startTime, editData.endTime, editData.resourceId, modalStepper, checkAvailability]);

    return (
        <TooltipProvider>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className={`${modalStepper === "main" ? "max-w-6xl p-0" : "max-w-2xl"} max-h-[90vh] overflow-y-auto`}
                onClick={(event) => event.stopPropagation()}
                onInteractOutside={(event) => event.preventDefault()}
            >
                {(isLoadingTSO || modalStepper === "main") && (
                    <DialogTitle className="sr-only">{entry?.resource?.name ? `Réservation ${entry.resource.name}` : 'Détail de réservation'}</DialogTitle>
                )}
                {(() => {
                    const onClose = () => handleOpenChange(false);
                    return (
                    <>
                        {isLoadingTSO ? (
                            <div>
                                <div className="flex justify-center items-center p-4">
                                    <Spinner size="lg"/>
                                </div>
                            </div>
                        ) : (
                            <>

                                {modalStepper !== "main" && (
                                    <DialogHeader className="text-neutral-900 dark:text-neutral-200">
                                        <div className="flex items-center justify-between gap-3 pr-8">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <ModalTooltip content="Retour">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => setModalStepper("main")}
                                                        className="text-neutral-600 dark:text-neutral-400"
                                                    >
                                                        <ArrowLeftIcon className="w-5 h-5"/>
                                                    </Button>
                                                </ModalTooltip>
                                                <DialogTitle className="truncate">{entry?.resource?.name}</DialogTitle>
                                            </div>
                                        </div>
                                    </DialogHeader>
                                )}
                                {previousNotReturned && new Date(previousNotReturned.endDate) < new Date() && (
                                    <></>
                                )}
                                {modalStepper === "edit" && (
                                    <div className="px-4 sm:px-6 pb-6">
                                        <div className="flex flex-col gap-5">
                                            <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:from-neutral-900 dark:to-neutral-950">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-4 text-left">
                                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
                                                            <PencilIcon className="h-7 w-7"/>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-primary-600 dark:text-primary-300">
                                                                Modification
                                                            </p>
                                                            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50">
                                                                Modifier la réservation
                                                            </h2>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-800">
                                                        <span className="block font-semibold text-neutral-900 dark:text-neutral-100">
                                                            {entry.resource?.name}
                                                        </span>
                                                        <span>
                                                            {formatDate(entry.startDate)} → {formatDate(entry.endDate)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Horaires */}
                                                <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                                    <div className="mb-4 flex items-center justify-between gap-3">
                                                        <div>
                                                            <h3 className="text-base font-semibold text-neutral-950 dark:text-neutral-50">
                                                                Dates et horaires
                                                            </h3>
                                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                                Choisissez une nouvelle plage de réservation.
                                                            </p>
                                                        </div>
                                                    </div>
                                                     <div className="grid gap-4 sm:grid-cols-2">
                                                             {/* Date et heure de début */}
                                                             <div className="rounded-2xl border border-neutral-200 bg-white/70 p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/70">
                                                                 <label
                                                                     className="mb-3 block text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                                                     Début
                                                                 </label>
                                                                 <div className="space-y-2">
                                                                     <ShadcnDatePicker
                                                                         required
                                                                         label="Date de début"
                                                                         value={dateToCalendarValue(editData.startDate)}
                                                                         max={dateToCalendarValue(editData.endDate)}
                                                                         onChange={(_, date) => date && setEditData(prev => ({...prev, startDate: date}))}
                                                                     />
                                                                     <HourSelect
                                                                         name="startTime"
                                                                         label="Heure de début"
                                                                         value={editData.startTime ? editData.startTime.getHours().toString().padStart(2, '0') : ''}
                                                                         onChange={(event) => setEditTime('startTime', event.target.value)}
                                                                     />
                                                                 </div>
                                                             </div>

                                                             {/* Date et heure de fin */}
                                                             <div className="rounded-2xl border border-neutral-200 bg-white/70 p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/70">
                                                                 <label
                                                                     className="mb-3 block text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                                                     Fin
                                                                 </label>
                                                                 <div className="space-y-2">
                                                                     <ShadcnDatePicker
                                                                         required
                                                                         label="Date de fin"
                                                                         value={dateToCalendarValue(editData.endDate)}
                                                                         min={dateToCalendarValue(editData.startDate)}
                                                                         onChange={(_, date) => date && setEditData(prev => ({...prev, endDate: date}))}
                                                                     />
                                                                     <HourSelect
                                                                         name="endTime"
                                                                         label="Heure de fin"
                                                                         value={editData.endTime ? editData.endTime.getHours().toString().padStart(2, '0') : ''}
                                                                         onChange={(event) => setEditTime('endTime', event.target.value)}
                                                                     />
                                                                 </div>
                                                             </div>
                                                    </div>
                                                </section>

                                                {/* Ressource */}
                                                <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                                    <label
                                                        className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                        Ressource
                                                    </label>
                                                    <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
                                                        Seules les ressources disponibles sur le même site et la même catégorie sont proposées.
                                                    </p>
                                                    <Combobox
                                                        items={availableResources}
                                                        value={editData.resourceId}
                                                        onValueChange={(resourceId) => setEditData(prev => ({...prev, resourceId}))}
                                                        itemToValue={(resource) => resource.id.toString()}
                                                        itemToString={(resource) => `${resource.name}${resource.id === entry.resourceId ? " (actuelle)" : ""}`}
                                                    >
                                                        <ComboboxInput placeholder="Sélectionner une ressource" />
                                                        <ComboboxContent>
                                                            <ComboboxEmpty>Aucune ressource disponible</ComboboxEmpty>
                                                            <ComboboxList>
                                                                {(resource) => (
                                                                    <ComboboxItem key={resource.id} value={resource.id.toString()}>
                                                                        {resource.name}{resource.id === entry.resourceId ? " (actuelle)" : ""}
                                                                    </ComboboxItem>
                                                                )}
                                                            </ComboboxList>
                                                        </ComboboxContent>
                                                    </Combobox>
                                                </section>

                                                {/* Utilisateur (admin seulement) */}
                                                {isAdmin && (
                                                    <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                                        <label
                                                            className="mb-2 block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                            Utilisateur
                                                        </label>
                                                        <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
                                                            Réassigner la réservation à un autre utilisateur.
                                                        </p>
                                                        <Combobox
                                                            items={availableUsers}
                                                            value={editData.userId}
                                                            onValueChange={(userId) => setEditData(prev => ({...prev, userId}))}
                                                            itemToValue={(user) => user.id.toString()}
                                                            itemToString={(user) => `${user.name} ${user.surname} - ${user.email}${user.id === entry.userId ? " (actuel)" : ""}`}
                                                        >
                                                            <ComboboxInput placeholder="Rechercher un utilisateur" />
                                                            <ComboboxContent>
                                                                <ComboboxEmpty>Aucun utilisateur trouvé</ComboboxEmpty>
                                                                <ComboboxList>
                                                                    {(user) => (
                                                                        <ComboboxItem key={user.id} value={user.id.toString()}>
                                                                            {user.name} {user.surname} - {user.email}{user.id === entry.userId ? " (actuel)" : ""}
                                                                        </ComboboxItem>
                                                                    )}
                                                                </ComboboxList>
                                                            </ComboboxContent>
                                                        </Combobox>
                                                    </section>
                                                )}

                                                {/* Statut de vérification */}
                                                <div
                                                    className={`flex items-center justify-between rounded-2xl border p-4 ${availabilityCheck.isLoading ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900 dark:bg-primary-950/30 dark:text-primary-300' : availabilityCheck.isAvailable ? 'border-success-200 bg-success-50 text-success-700 dark:border-success-900 dark:bg-success-950/30 dark:text-success-300' : availabilityCheck.message ? 'border-danger-200 bg-danger-50 text-danger-700 dark:border-danger-900 dark:bg-danger-950/30 dark:text-danger-300' : 'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400'}`}>
                                                    <div className="flex items-center gap-2">
                                                        {availabilityCheck.isLoading ? (
                                                            <>
                                                                <Spinner size="sm"/>
                                                                <span className="text-sm font-medium">
                                                                     Vérification en cours...
                                                                </span>
                                                            </>
                                                        ) : availabilityCheck.isAvailable ? (
                                                            <>
                                                                <CheckIcon className="h-5 w-5"/>
                                                                <span className="text-sm font-medium">
                                                                     {availabilityCheck.message}
                                                                </span>
                                                            </>
                                                        ) : availabilityCheck.message ? (
                                                            <>
                                                                <XMarkIcon className="h-5 w-5"/>
                                                                <span className="text-sm font-medium">
                                                                     {availabilityCheck.message}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm font-medium">
                                                                Modifiez les informations pour vérifier la disponibilité.
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}

                                {modalStepper === "delete" && (
                                    <div>
                                        <div className="flex flex-col space-y-6">
                                            <div className="flex flex-col items-center text-center space-y-2">
                                                <div className="p-3 rounded-full bg-danger-50 dark:bg-danger-950/30">
                                                    <ShieldExclamationIcon className="w-8 h-8 text-danger-500"/>
                                                </div>
                                                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                                    Confirmer l&apos;annulation
                                                </h2>
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm">
                                                    Êtes-vous sûr de vouloir {adminMode ? "supprimer" : "annuler"} cette
                                                    réservation ?
                                                    Cette action est irréversible.
                                                </p>
                                            </div>

                                            {entry && (
                                                <div
                                                    className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                            Ressource
                                                        </span>
                                                        <span
                                                            className="text-sm text-neutral-900 dark:text-neutral-100">
                                                            {entry.resource?.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                            Date
                                                        </span>
                                                        <span
                                                            className="text-sm text-neutral-900 dark:text-neutral-100">
                                                            {new Date(entry.startDate).toLocaleDateString("fr-FR", {
                                                                weekday: 'long',
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                            Horaires
                                                        </span>
                                                        <span
                                                            className="text-sm text-neutral-900 dark:text-neutral-100">
                                                            {new Date(entry.startDate).toLocaleTimeString("fr-FR", {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })} - {new Date(entry.endDate).toLocaleTimeString("fr-FR", {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                )}

                                {(modalStepper === "pickup" || modalStepper === "return") && (
                                    <div>
                                        <div className="flex flex-col justify-center items-center space-y-6 py-2">
                                            {error !== null && (
                                                <div
                                                    className="bg-red-100 dark:bg-red-900/20 p-3 rounded-lg w-full text-center">
                                                    <span className="text-red-500 dark:text-red-400">{error}</span>
                                                </div>
                                            )}
                                            <div className="flex flex-col items-center space-y-4 w-full">
                                                <div className="text-center space-y-2">
                                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {modalStepper === "pickup" ? "Confirmation de récupération" : "Confirmation de restitution"}
                                                    </h3>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                        Saisissez le code à 6 chiffres envoyé à
                                                        <span
                                                            className="font-semibold ml-1 text-neutral-900 dark:text-neutral-100">
                                                            {entry?.user.email}
                                                        </span>
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-center space-y-4 w-full max-w-md">
                                                    <div className="flex items-center space-x-4">
                                                        <Input
                                                            value={otp}
                                                            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                                            onPaste={(event) => {
                                                                event.preventDefault();
                                                                setOtp(event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6));
                                                            }}
                                                            inputMode="numeric"
                                                            maxLength={6}
                                                            name="confirmation_code"
                                                            className="w-40 text-center text-2xl tracking-[0.3em]"
                                                        />
                                                        {otp.length === 6 ? (
                                                            <Button
                                                                size="icon"
                                                                disabled={updateEntryMutation.isPending}
                                                                onClick={handleUpdateEntity}
                                                            >
                                                                {updateEntryMutation.isPending ? (
                                                                    <Spinner className="h-5 w-5"/>
                                                                ) : (
                                                                    <svg width="24" height="24" viewBox="0 0 24 24"
                                                                         fill="none"
                                                                         stroke="currentColor" strokeWidth="2">
                                                                        <path d="M20 6L9 17L4 12"/>
                                                                    </svg>
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="icon"
                                                                disabled={updateEntryMutation.isPending}
                                                                onClick={async () => {
                                                                    if (!navigator.clipboard?.readText) {
                                                                        addToast({title: "Presse-papiers indisponible", description: "Collez le code directement dans le champ.", color: "warning", timeout: 4000});
                                                                        return;
                                                                    }

                                                                    try {
                                                                        const text = await navigator.clipboard.readText();
                                                                        // Si le texte collé contient uniquement des chiffres et a une longueur de 6 ou moins
                                                                        const code = text.replace(/\D/g, '').slice(0, 6);
                                                                        if (code) setOtp(code);
                                                                    } catch (err) {
                                                                        addToast({title: "Presse-papiers bloqué", description: "Collez le code directement dans le champ avec Cmd/Ctrl+V.", color: "warning", timeout: 4000});
                                                                    }
                                                                }}
                                                            >
                                                                <svg width="24" height="24" viewBox="0 0 24 24"
                                                                     fill="none"
                                                                     stroke="currentColor" strokeWidth="2">
                                                                    <rect x="9" y="9" width="13" height="13" rx="2"
                                                                          ry="2"></rect>
                                                                    <path
                                                                        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                                </svg>
                                                            </Button>
                                                        )}
                                                        
                                                    </div>

                                                    <div className="flex flex-col items-center space-y-2 w-full">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={handleResendCode}
                                                            disabled={resendTimer > 0 || updateEntryMutation.isPending}
                                                            className="text-sm"
                                                        >
                                                            {resendTimer > 0
                                                                ? `Renvoyer le code dans ${resendTimer}s`
                                                                : "Renvoyer le code"}
                                                        </Button>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {modalStepper === "main" && (() => {
                                    const startDate = new Date(entry.startDate);
                                    const endDate = new Date(entry.endDate);
                                    const nowDate = new Date();
                                    const isConfirmed = entry.moderate !== "WAITING" && entry.moderate !== "REJECTED";
                                    const isOverdue = (entry.moderate === "USED" || isAutomaticOngoing) && endDate < nowDate;
                                    const pickupActive = entry.moderate === "USED" || isAutomaticOngoing || (entry.moderate === "ACCEPTED" && startDate <= nowDate && endDate > nowDate);
                                    const pickupDone = (entry.moderate === "ENDED" && entry.returned) || isAutomaticEnded;
                                    const returnDone = (entry.moderate === "ENDED" && entry.returned) || isAutomaticEnded;
                                    const canReturnNow = !returnDone && (entry.moderate === "USED" || isAutomaticOngoing);
                                    const categoryName = entry.resource?.category?.name || "Matériel";
                                    const siteName = entry.resource?.domains?.name || entry.resource?.domain?.name || "Site non renseigné";
                                    const ownerName = handleOwnerReturn(entry);
                                    const pickupPlace = entry.resource?.name || "Lieu de retrait";

                                    return (
                                        <div className="bg-white text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50">
                                            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_18rem]">
                                                <main className="min-w-0">
                                                    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-violet-50 text-blue-600 dark:bg-violet-950/30 dark:text-blue-300">
                                                                <CubeIcon className="h-10 w-10"/>
                                                            </div>
                                                            <div className="min-w-0 flex-1 space-y-3">
                                                                <div className="flex flex-wrap items-center gap-3">
                                                                    <h2 className="truncate text-2xl font-black tracking-tight text-neutral-950 dark:text-neutral-50">
                                                                        {entry.resource?.name}
                                                                    </h2>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                                                    <span className="inline-flex items-center gap-2"><CubeIcon className="h-5 w-5"/>{categoryName}</span>
                                                                    <span>·</span>
                                                                    <span className="inline-flex items-center gap-2"><BuildingOffice2Icon className="h-5 w-5"/>{siteName}</span>
                                                                    {ownerName && (
                                                                        <>
                                                                            <span>·</span>
                                                                            <span className="inline-flex items-center gap-2"><UserGroupIcon className="h-5 w-5"/>{ownerName}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {hasGroupNavigation && (
                                                            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900">
                                                                <ModalTooltip content="Occurrence précédente">
                                                                    <Button
                                                                        type="button"
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        disabled={currentGroupIndex <= 0}
                                                                        onClick={() => selectGroupEntry(sortedGroupEntries[currentGroupIndex - 1])}
                                                                        aria-label="Occurrence précédente"
                                                                    >
                                                                        <ChevronLeftIcon className="h-5 w-5"/>
                                                                    </Button>
                                                                </ModalTooltip>
                                                                <div className="w-44 [&>div]:my-0 [&_label]:sr-only [&_button]:h-10 [&_button]:justify-center [&_button]:rounded-xl [&_button]:px-3 [&_button]:font-bold">
                                                                    <ShadcnDatePicker
                                                                        label="Occurrence"
                                                                        value={dateToCalendarValue(new Date(entry.startDate))}
                                                                        onChange={(_, date) => selectGroupEntryByDate(date)}
                                                                        isDateDisabled={(date) => !allowedGroupDates.has(date.toDateString())}
                                                                    />
                                                                </div>
                                                                <ModalTooltip content="Occurrence suivante">
                                                                    <Button
                                                                        type="button"
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        disabled={currentGroupIndex >= sortedGroupEntries.length - 1}
                                                                        onClick={() => selectGroupEntry(sortedGroupEntries[currentGroupIndex + 1])}
                                                                        aria-label="Occurrence suivante"
                                                                    >
                                                                        <ChevronRightIcon className="h-5 w-5"/>
                                                                    </Button>
                                                                </ModalTooltip>
                                                            </div>
                                                        )}
                                                    </header>

                                                    <div className="space-y-5">
                                                        <BookingStepCard
                                                            step={1}
                                                            title="Création de la réservation"
                                                            description="Votre demande a été enregistrée."
                                                            metaIcon={CalendarDaysIcon}
                                                            metaDate={formatShortDate(entry.createdAt)}
                                                            metaTime={formatShortTime(entry.createdAt)}
                                                            done
                                                        />

                                                        <BookingStepCard
                                                            step={2}
                                                            title="Confirmation"
                                                            description={isConfirmed ? "Réservation confirmée automatiquement." : entry.moderate === "REJECTED" ? "Réservation refusée." : "En attente de validation."}
                                                            metaIcon={EnvelopeIcon}
                                                            metaDate={isConfirmed ? formatShortDate(entry.lastUpdatedModerateStatus || entry.createdAt) : null}
                                                            metaTime={isConfirmed ? formatShortTime(entry.lastUpdatedModerateStatus || entry.createdAt) : null}
                                                            done={isConfirmed}
                                                            active={entry.moderate === "WAITING"}
                                                            failed={entry.moderate === "REJECTED"}
                                                        />

                                                        {entry.moderate === "BLOCKED" ? (
                                                            <BookingStepCard
                                                                step={3}
                                                                title="Ressource bloquée"
                                                                description={`Cette ressource est bloquée jusqu'au ${formatDate(entry.endDate)}.`}
                                                                failed
                                                                last
                                                            />
                                                        ) : (
                                                            <>
                                                                <BookingStepCard
                                                                    step={3}
                                                                    title={localIsAbleToPickUp() && requiresPickupCode(entry) ? "Confirmer la récupération" : pickupActive ? "Prise en charge" : entry.moderate === "ACCEPTED" && endDate < nowDate && !isAutomaticEnded ? "Réservation expirée" : "Prise en charge"}
                                                                    description={pickupActive ? `La ressource est disponible dans ${pickupPlace}.` : localIsAbleToPickUp() ? "Vous pouvez prendre la ressource dès maintenant." : pickupUnavailableReason || `Prise en charge prévue le ${formatDate(entry.startDate)}.`}
                                                                    metaIcon={ClockIcon}
                                                                    metaLabel={pickupActive ? "En cours depuis" : null}
                                                                    metaDate={formatShortDate(entry.startDate)}
                                                                    metaTime={formatShortTime(entry.startDate)}
                                                                    active={pickupActive || localIsAbleToPickUp()}
                                                                    done={pickupDone}
                                                                    failed={entry.moderate === "REJECTED" || (endDate < nowDate && (entry.moderate === "ACCEPTED" || entry.moderate === "WAITING") && !isAutomaticEnded)}
                                                                >
                                                                    {new Date(entry.startDate) <= nowDate && entry?.resource?.status === 'UNAVAILABLE' && previousNotReturned && (
                                                                        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300">
                                                                            Emprunteur précédent : {previousNotReturned.user?.name} {previousNotReturned.user?.surname}
                                                                        </div>
                                                                    )}
                                                                    {entry.moderate === "ACCEPTED" && endDate > nowDate && (localIsAbleToPickUp() || requiresPickupCode(entry)) && (
                                                                        <div className="space-y-4">
                                                                            {!localIsAbleToPickUp() && (
                                                                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                                                                    <p className="font-bold">Récupération non disponible</p>
                                                                                    <p className="mt-1">{pickupUnavailableReason}</p>
                                                                                    {hasBlockingPrevious && (
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="outline"
                                                                                            className="mt-3 border-amber-300 bg-white text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900"
                                                                                            disabled={isReportingBlocking}
                                                                                            onClick={handleReportBlocking}
                                                                                        >
                                                                                            {isReportingBlocking ? 'Signalement...' : 'Signaler le blocage'}
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            {!requiresPickupCode(entry) && (
                                                                                <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                                                                                    <div className="flex items-start gap-3">
                                                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
                                                                                            <HandRaisedIcon className="h-6 w-6"/>
                                                                                        </div>
                                                                                        <div>
                                                                                            <h4 className="font-bold text-neutral-950 dark:text-neutral-50">
                                                                                                Je prends la ressource
                                                                                            </h4>
                                                                                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                                                                                Validez pour prendre en charge la ressource.
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <Button
                                                                                        disabled={!localIsAbleToPickUp() || hasBlockingPrevious || isPickupLoading}
                                                                                        className="mt-5 w-full sm:w-auto"
                                                                                        onClick={() => handlePickUp(onClose)}
                                                                                    >
                                                                                        {isPickupLoading ? <><Spinner className="h-4 w-4"/>Récupération...</> : localIsAbleToPickUp() ? "Je prends la ressource" : "Récupération indisponible"}
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                            {requiresPickupCode(entry) && (
                                                                            <InlineCodeEntry
                                                                                title={null}
                                                                                description="Saisissez le code reçu par mail pour prendre en charge la ressource sur"
                                                                                email={entry?.user?.email}
                                                                                otp={otp}
                                                                                error={error}
                                                                                resendTimer={resendTimer}
                                                                                isSubmitting={updateEntryMutation.isPending}
                                                                                confirmDisabled={!localIsAbleToPickUp() || hasBlockingPrevious || isPickupLoading}
                                                                                confirmLabel="Confirmer la récupération"
                                                                                onOtpChange={(value) => {
                                                                                    setError(null);
                                                                                    setOtp(value);
                                                                                }}
                                                                                onConfirm={() => handleUpdateEntity('pickup')}
                                                                                onResend={handleResendCode}
                                                                            />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </BookingStepCard>

                                                                <BookingStepCard
                                                                    step={4}
                                                                    title={returnDone ? "Restituée" : canReturnNow && requiresReturnCode(entry) ? "Confirmer la restitution" : "Restitution"}
                                                                    description={<ReturnDueDescription targetDate={entry.endDate} done={returnDone}/>}
                                                                    metaIcon={CalendarDaysIcon}
                                                                    metaDate={formatShortDate(entry.endDate)}
                                                                    metaTime={formatShortTime(entry.endDate)}
                                                                    done={returnDone}
                                                                    active={entry.moderate === "USED" || isAutomaticEnded}
                                                                    failed={(entry?.returned === false && entry.endDate <= nowDate.toISOString() && entry.moderate === "USED") || entry.moderate === "REJECTED"}
                                                                    last
                                                                >
                                                                    {canReturnNow && (
                                                                        <div className="space-y-4">
                                                                            {!requiresReturnCode(entry) && (
                                                                                <Button size="lg" className="w-full rounded-xl font-bold shadow-md shadow-blue-500/20 sm:w-auto" disabled={isReturnLoading} onClick={handleReturn}>
                                                                                    {isReturnLoading ? <Spinner className="h-5 w-5"/> : <ArrowUturnLeftIcon className="h-5 w-5"/>}
                                                                                    {isReturnLoading ? "Restitution..." : adminMode ? "Forcer la restitution" : "Restituer maintenant"}
                                                                                </Button>
                                                                            )}
                                                                            {requiresReturnCode(entry) && (
                                                                                <InlineCodeEntry
                                                                                    title={null}
                                                                                    description="Saisissez le code reçu par mail pour restituer la ressource sur"
                                                                                    email={entry?.user?.email}
                                                                                    otp={otp}
                                                                                    error={error}
                                                                                    resendTimer={resendTimer}
                                                                                    isSubmitting={updateEntryMutation.isPending}
                                                                                    confirmDisabled={isReturnLoading}
                                                                                    confirmLabel="Confirmer la restitution"
                                                                                    onOtpChange={(value) => {
                                                                                        setError(null);
                                                                                        setOtp(value);
                                                                                    }}
                                                                                    onConfirm={() => handleUpdateEntity('return')}
                                                                                    onResend={handleResendCode}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </BookingStepCard>
                                                            </>
                                                        )}
                                                    </div>

                                                </main>

                                                <aside className="space-y-4 lg:pt-[6.5rem]">
                                                    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-950 shadow-sm dark:border-orange-900 dark:bg-orange-950/20 dark:text-orange-100">
                                                        <div className="flex gap-3">
                                                            <BellAlertIcon className="h-6 w-6 text-orange-500"/>
                                                            <div>
                                                                <h3 className="font-bold">Rappel rapide</h3>
                                                                <p className="mt-2 text-sm leading-6 text-orange-900/80 dark:text-orange-100/80">
                                                                    Rendez la ressource propre et vérifiez que tous les accessoires sont bien rangés.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </section>

                                                    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                                                        <h3 className="font-bold text-neutral-950 dark:text-neutral-50">Règles d&apos;utilisation</h3>
                                                        <div className="mt-4 space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                                                            {['Utilisation conforme et responsable', 'Matériel non transférable', 'Respect des horaires de réservation'].map((rule) => (
                                                                <div key={rule} className="flex items-center gap-2">
                                                                    <CheckIcon className="h-5 w-5 text-emerald-500"/>
                                                                    <span>{rule}</span>
                                                                </div>
                                                            ))}
                                                            {!adminMode && entry.moderate === "USED" && (
                                                                <Button type="button" variant="outline" className="mt-2 w-full justify-center border-orange-300 text-orange-700 hover:bg-orange-50" onClick={() => setIsProblemReportOpen(true)}>
                                                                    <ShieldExclamationIcon className="h-5 w-5"/>
                                                                    Signaler tout problème
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </section>

                                                    <ResourceEventModal
                                                        open={isProblemReportOpen}
                                                        onOpenChange={setIsProblemReportOpen}
                                                        resource={entry.resource}
                                                        entry={entry}
                                                        mode="user"
                                                    />

                                                    {conversationButtonLabel && (
                                                        <Button
                                                            size="lg"
                                                            variant="secondary"
                                                            className="w-full justify-center"
                                                            onClick={() => router.push(`/?msgId=${entry.id}`)}
                                                        >
                                                            <EnvelopeIcon className="h-5 w-5"/>
                                                            {conversationButtonLabel}
                                                        </Button>
                                                    )}

                                                    {entry.moderate === "ACCEPTED" || entry.moderate === "WAITING" ? (
                                                        <section className="space-y-3">
                                                            <Button
                                                                size="lg"
                                                                variant="secondary"
                                                                className="w-full justify-center"
                                                                onClick={initializeEditData}
                                                            >
                                                                <PencilIcon className="h-5 w-5"/>
                                                                Modifier
                                                            </Button>
                                                             {!adminMode && (
                                                                 <ModalTooltip content="Annuler définitivement la réservation.">
                                                                     <Button
                                                                        size="lg"
                                                                        variant="secondary"
                                                                        className="w-full justify-center"
                                                                        onClick={() => setModalStepper("delete")}
                                                                    >
                                                                        <TrashIcon className="h-5 w-5"/>
                                                                        Annuler la réservation
                                                                     </Button>
                                                                 </ModalTooltip>
                                                             )}
                                                             {hasGroupNavigation && !adminMode && onCancelGroup && (
                                                                 <ModalTooltip content={canCancelGroup ? "Annuler toutes les occurrences du groupe." : "Impossible d'annuler le groupe, une réservation est en cours ou en retard."}>
                                                                     <Button
                                                                         size="lg"
                                                                         variant="secondary"
                                                                         disabled={!canCancelGroup}
                                                                         className="w-full justify-center border-red-200 text-red-600 hover:bg-red-50 disabled:text-neutral-400"
                                                                         onClick={onCancelGroup}
                                                                     >
                                                                         <TrashIcon className="h-5 w-5"/>
                                                                         Annuler le groupe
                                                                     </Button>
                                                                 </ModalTooltip>
                                                             )}
                                                         </section>
                                                     ) : null}

                                                </aside>
                                            </div>
                                        </div>
                                    );
                                })()}
                                {['edit', 'delete'].includes(modalStepper) && <DialogFooter className="flex flex-col-reverse gap-3 border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                                    {modalStepper === "edit" && (
                                        <>
                                            <Button
                                                size="lg"
                                                variant="secondary"
                                                className="sm:min-w-36"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setModalStepper("main");
                                                }}
                                            >
                                                Annuler
                                            </Button>
                                            <Button
                                                size="lg"
                                                className="font-semibold sm:min-w-64"
                                                onClick={applyModifications}
                                                disabled={!availabilityCheck.isAvailable || availabilityCheck.isLoading}
                                            >
                                                {availabilityCheck.isLoading ? "Vérification..." : availabilityCheck.isAvailable ? "Appliquer les modifications" : "Choisir un créneau disponible"}
                                            </Button>
                                        </>
                                    )}
                                    {modalStepper === "delete" && (
                                        <>
                                            <Button
                                                size="lg"
                                                variant="secondary"
                                                className="sm:min-w-36"
                                                onClick={() => setModalStepper("main")}
                                            >
                                                Annuler
                                            </Button>
                                            <Button
                                                size="lg"
                                                variant="destructive"
                                                onClick={() => {
                                                    handleDeleteEntry();
                                                    onClose();
                                                }}
                                                className="font-medium sm:min-w-56"
                                            >
                                                Confirmer l&apos;annulation
                                            </Button>
                                        </>
                                    )}
                                </DialogFooter>}
                            </>
                        )}
                    </>
                    );
                })()}
            </DialogContent>
        </Dialog>
        </TooltipProvider>

    )
}
