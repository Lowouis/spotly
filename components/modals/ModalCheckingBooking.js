import {
    Autocomplete,
    AutocompleteItem,
    Button,
    Input,
    InputOtp,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Spinner,
    Tooltip,
    useDisclosure
} from "@heroui/react";

import {
    ArrowLeftIcon,
    ArrowUturnLeftIcon,
    CheckIcon,
    HandRaisedIcon,
    PencilIcon,
    ShieldExclamationIcon,
    XMarkIcon
} from "@heroicons/react/24/outline";
import Stepper from "@/components/utils/Stepper";
import React, {useCallback, useEffect, useState} from "react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {useEmail} from "@/context/EmailContext";
import {addToast} from "@heroui/toast";
import EntryComments from "@/components/comments/EntryComments";
import {useEntryActions} from "@/hooks/useEntryActions";
import {useSession} from "next-auth/react";


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

// Composant de décompte
const CountdownTimer = ({targetDate, textBefore = ""}) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate) - new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60)
                });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Mise à jour toutes les minutes

        return () => clearInterval(timer);
    }, [targetDate]);

    if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <span>{textBefore}</span>
            {timeLeft.days > 0 && <span className="font-semibold">{timeLeft.days}j</span>}
            {timeLeft.hours > 0 && <span className="font-semibold">{timeLeft.hours}h</span>}
            <span className="font-semibold">{timeLeft.minutes}m</span>
        </div>
    );
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

export default function ModalCheckingBooking({
                                                 entry,
                                                 adminMode = false,
                                                 handleRefresh,
                                                 isOpen: controlledIsOpen,
                                                 onOpenChange: controlledOnOpenChange,
                                                 setUserAlert
                                             }) {
    const {
        isOpen: uncontrolledIsOpen,
        onOpen: onUncontrolledOpen,
        onOpenChange: onUncontrolledOpenChange
    } = useDisclosure();

    const isControlled = controlledIsOpen !== undefined;

    const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;
    const onOpenChange = isControlled ? controlledOnOpenChange : onUncontrolledOpenChange;
    const onOpen = isControlled ? () => onOpenChange(true) : onUncontrolledOpen;

    const [otp, setOtp] = useState("");
    const [error, setError] = useState(null);
    const [resendTimer, setResendTimer] = useState(0);
    const [modalStepper, setModalStepper] = useState("main");
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
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN';

    // Use the centralized hook
    const {
        timeScheduleOptions,
        isLoadingTSO,
        hasBlockingPrevious,
        isAbleToPickUp,
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



        
    const handlePickUp = (onClose)=>{
        setError(null);
        setOtp("");
        if (whichPickable() === "DIGIT" || whichPickable() === "HIGH_AUTH" || whichPickable() === "LOW_AUTH") {
            setModalStepper("pickup")
        } else {
            hookHandlePickUp(onClose, handleRefresh);
        }
        handleRefresh();
    }

    const handleReturn = ()=>{
        setError(null);
        setOtp("");

        if (whichPickable() === "DIGIT" || whichPickable() === "HIGH_AUTH" || whichPickable() === "LOW_AUTH") {
            setModalStepper("return")
        } else {
            hookHandleReturn(null, handleRefresh);
        }
    }
    const whichPickable = () => {

        if (entry.resource.pickable !== undefined && entry.resource.pickable !== null) {
            return entry.resource.pickable.name;
        } else if (entry.resource.category.pickable !== undefined && entry.resource.category.pickable !== null) {
            return entry.resource.category.pickable.name;
        }
        return entry.resource.domains.pickable.name;
    }

    const validDatesToPickup = () => {
        if (isLoadingTSO || !timeScheduleOptions) {
            return false;
        }
        const nowIso = new Date().toISOString();
        // Autoriser avant l'heure si pas de file d'attente et ressource disponible
        const allowEarly = (entry?.resource?.status === 'AVAILABLE') && (!waitEnabled || waitlistCount === 0);
        return allowEarly || (timeScheduleOptions.ajustedStartDate <= nowIso);
    }

    const entryAction = ()=> {
        if (whichPickable(entry) === "LOW_TRUST" || whichPickable(entry) === "FLUENT") {
            return "NODIGIT";
        } else {
            return "DIGIT"
        }
    }


    const { mutate: updateEntry } = useMutation({
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

    const handlePickUpUpdate = () => {
        addToast({
            title: "Pick-up",
            description : "La récupèration de la ressource à bien été prise en compte.",
            timeout: 5000,
            color : "primary"
        });

        updateEntry({
            entry,
            updateData: { moderate: "USED" },
            method : "PUT"
        });
        setModalStepper("main")
        setOtp("");
        handleRefresh();
    }

    const handleReturnUpdate = () => {
        addToast({
            title: "Restitution",
            description : "La ressource à bien été retournée.",
            timeout: 5000,
            color : "success"
        });
        updateEntry({
            entry,
            updateData: { returned: true, moderate: "ENDED" },
            method : "PUT"
        });
        setModalStepper("main");
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
        handleRefresh();
    }


    const handleDeleteEntry = () => {
        updateEntry({
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

    const handleUpdateEntity = () => {
        if(otp === entry.returnedConfirmationCode){
            modalStepper === "return" ? handleReturnUpdate({ entry }) : handlePickUpUpdate({ entry });
        } else {
            setError("Le code ne correspond pas, veuillez réessayer");
        }
    };
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

    // Fonction pour gérer le renvoi du code
    // Fonction pour initialiser les données d'édition
    const initializeEditData = () => {
        const startDate = new Date(entry.startDate);
        const endDate = new Date(entry.endDate);

        console.log('DEBUG - initializeEditData:', {
            entryStartDate: entry.startDate,
            entryEndDate: entry.endDate,
            startDate: startDate,
            endDate: endDate,
            startDateType: typeof startDate,
            endDateType: typeof endDate
        });

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
                setAvailableResources(resources.filter(r => r.status === 'AVAILABLE'));
            }
        } catch (error) {
            console.error('Erreur lors du chargement des ressources:', error);
        }
    }, [entry.resource.categoryId, entry.resource.domainId]);

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

    const handleResendCode = () => {
        if (resendTimer > 0) return;

        // Réinitialiser le timer à 30 secondes
        setResendTimer(30);


        sendEmail({
            to: entry.user.email,
            subject: "Code de réservation pour : " + entry.resource.name,
            templateName: "resentCode",
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
                key : entry.returnedConfirmationCode
            }
        });

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
        <>
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="2xl"
            onClose={() => {
                setModalStepper("main");
                setOtp("");
            }}
            isDismissable={false}
            motionProps={{
                variants: {
                    enter: {
                        y: 0,
                        opacity: 1,
                        transition: {
                            duration: 0.15,
                            ease: "easeOut",
                        },
                    },
                    exit: {
                        y: -20,
                        opacity: 0,
                        transition: {
                            duration: 0.15,
                            ease: "easeIn",
                        },
                    },
                },
            }}
            classNames={{
                closeButton: "text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 dark:text-neutral-400 rounded-full p-3 text-sm transition-all"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        {isLoadingTSO ? (
                            <ModalBody>
                                <div className="flex justify-center items-center p-4">
                                    <Spinner size="lg"/>
                                </div>
                            </ModalBody>
                        ) : (
                            <>

                                <ModalHeader
                                    className="flex flex-row items-center gap-3 text-neutral-900 dark:text-neutral-200">
                                    {modalStepper !== "main" && (
                                        <Tooltip content="Retour" color="foreground" showArrow>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onPress={() => setModalStepper("main")}
                                                className="text-neutral-600 dark:text-neutral-400"
                                            >
                                                <ArrowLeftIcon className="w-5 h-5"/>
                                            </Button>
                                        </Tooltip>
                                    )}
                                    {entry?.resource?.name}
                                </ModalHeader>
                                {previousNotReturned && new Date(previousNotReturned.endDate) < new Date() && (
                                    <></>
                                )}
                                {modalStepper === "edit" && (
                                    <ModalBody>
                                        <div className="flex flex-col space-y-6">
                                            <div className="flex flex-col items-center text-center space-y-2">
                                                <div className="p-3 rounded-full bg-neutral-50 dark:bg-neutral-900">
                                                    <PencilIcon className="w-8 h-8 text-neutral-500"/>
                                                </div>
                                                <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                                    Modifier la réservation
                                                </h2>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Horaires */}
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label
                                                            className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                            Dates et horaires
                                                        </label>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {/* Date et heure de début */}
                                                            <div className="space-y-2">
                                                                <label
                                                                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                                    Début
                                                                </label>
                                                                <div className="space-y-2">
                                                                    <Input
                                                                        type="date"
                                                                        value={editData.startDate ? editData.startDate.toISOString().split('T')[0] : ''}
                                                                        onChange={(e) => {
                                                                            const newDate = new Date(e.target.value);
                                                                            setEditData(prev => ({
                                                                                ...prev,
                                                                                startDate: newDate
                                                                            }));
                                                                        }}
                                                                        className="w-full"
                                                                        variant="bordered"
                                                                        size="sm"
                                                                    />
                                                                    <Input
                                                                        type="time"
                                                                        value={editData.startTime ? editData.startTime.toTimeString().slice(0, 5) : ''}
                                                                        onChange={(e) => {
                                                                            const [hours, minutes] = e.target.value.split(':');
                                                                            const newTime = new Date();
                                                                            newTime.setHours(parseInt(hours), parseInt(minutes));
                                                                            setEditData(prev => ({
                                                                                ...prev,
                                                                                startTime: newTime
                                                                            }));
                                                                        }}
                                                                        className="w-full"
                                                                        variant="bordered"
                                                                        size="sm"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Date et heure de fin */}
                                                            <div className="space-y-2">
                                                                <label
                                                                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                                    Fin
                                                                </label>
                                                                <div className="space-y-2">
                                                                    <Input
                                                                        type="date"
                                                                        value={editData.endDate ? editData.endDate.toISOString().split('T')[0] : ''}
                                                                        onChange={(e) => {
                                                                            const newDate = new Date(e.target.value);
                                                                            setEditData(prev => ({
                                                                                ...prev,
                                                                                endDate: newDate
                                                                            }));
                                                                        }}
                                                                        className="w-full"
                                                                        variant="bordered"
                                                                        size="sm"
                                                                    />
                                                                    <Input
                                                                        type="time"
                                                                        value={editData.endTime ? editData.endTime.toTimeString().slice(0, 5) : ''}
                                                                        onChange={(e) => {
                                                                            const [hours, minutes] = e.target.value.split(':');
                                                                            const newTime = new Date();
                                                                            newTime.setHours(parseInt(hours), parseInt(minutes));
                                                                            setEditData(prev => ({
                                                                                ...prev,
                                                                                endTime: newTime
                                                                            }));
                                                                        }}
                                                                        className="w-full"
                                                                        variant="bordered"
                                                                        size="sm"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Ressource */}
                                                <div>
                                                    <label
                                                        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                                        Ressource
                                                    </label>
                                                    <Autocomplete
                                                        selectedKey={editData.resourceId}
                                                        onSelectionChange={(key) => {
                                                            setEditData(prev => ({...prev, resourceId: key}));
                                                        }}
                                                        className="w-full"
                                                        placeholder="Sélectionner une ressource"
                                                        aria-label="Sélectionner une ressource"
                                                        emptyContent="Aucune ressource disponible"
                                                    >
                                                        {availableResources.map((resource) => (
                                                            <AutocompleteItem key={resource.id}
                                                                              textValue={resource.name}>
                                                                {resource.name}
                                                            </AutocompleteItem>
                                                        ))}
                                                    </Autocomplete>
                                                </div>

                                                {/* Utilisateur (admin seulement) */}
                                                {isAdmin && (
                                                    <div>
                                                        <label
                                                            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                                            Utilisateur
                                                        </label>
                                                        <Autocomplete
                                                            selectedKey={editData.userId}
                                                            onSelectionChange={(key) => {
                                                                setEditData(prev => ({...prev, userId: key}));
                                                            }}
                                                            className="w-full"
                                                            placeholder="Rechercher un utilisateur"
                                                            aria-label="Rechercher un utilisateur"
                                                            defaultItems={availableUsers}
                                                            emptyContent="Aucun utilisateur trouvé"
                                                        >
                                                            {availableUsers.map((user) => (
                                                                <AutocompleteItem
                                                                    key={user.id}
                                                                    textValue={`${user.name} ${user.surname} ${user.email}`}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">
                                                                            {user.name} {user.surname}
                                                                        </span>
                                                                        <span className="text-sm text-neutral-500">
                                                                            {user.email}
                                                                        </span>
                                                                    </div>
                                                                </AutocompleteItem>
                                                            ))}
                                                        </Autocomplete>
                                                    </div>
                                                )}

                                                {/* Statut de vérification */}
                                                <div
                                                    className="flex items-center justify-between p-3 rounded-lg border">
                                                    <div className="flex items-center gap-2">
                                                        {availabilityCheck.isLoading ? (
                                                            <>
                                                                <Spinner size="sm"/>
                                                                <span
                                                                    className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                    Vérification en cours...
                                                                </span>
                                                            </>
                                                        ) : availabilityCheck.isAvailable ? (
                                                            <>
                                                                <CheckIcon className="w-5 h-5 text-success-500"/>
                                                                <span
                                                                    className="text-sm text-success-600 dark:text-success-400">
                                                                    {availabilityCheck.message}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XMarkIcon className="w-5 h-5 text-danger-500"/>
                                                                <span
                                                                    className="text-sm text-danger-600 dark:text-danger-400">
                                                                    {availabilityCheck.message}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row justify-end gap-2 pt-2">
                                                <Button
                                                    size="lg"
                                                    color="default"
                                                    variant="flat"
                                                    onPress={() => {
                                                        setIsEditing(false);
                                                        setModalStepper("main");
                                                    }}
                                                >
                                                    Annuler
                                                </Button>
                                                <Button
                                                    size="lg"
                                                    color="primary"
                                                    variant="flat"
                                                    onPress={applyModifications}
                                                    isDisabled={!availabilityCheck.isAvailable || availabilityCheck.isLoading}
                                                >
                                                    {availabilityCheck.isAvailable ? "Appliquer les modifications" : "Indisponible"}
                                                </Button>
                                            </div>
                                        </div>
                                    </ModalBody>
                                )}

                                {modalStepper === "delete" && (
                                    <ModalBody>
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

                                            <div className="flex flex-row justify-end pt-2">
                                                <Button
                                                    size="lg"
                                                    color="danger"
                                                    variant="flat"
                                                    onPress={() => {
                                                        handleDeleteEntry();
                                                        onClose();
                                                    }}
                                                    className="font-medium"
                                                >
                                                    Confirmer l&apos;annulation
                                                </Button>
                                            </div>
                                        </div>
                                    </ModalBody>
                                )}

                                {(modalStepper === "pickup" || modalStepper === "return") && (
                                    <ModalBody>
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
                                                        <InputOtp
                                                            onValueChange={setOtp}
                                                            value={otp}
                                                            variant="bordered"
                                                            size="lg"
                                                            length={6}
                                                            name="confirmation_code"
                                                            classNames={{
                                                                input: "text-2xl",
                                                                base: "gap-3"
                                                            }}
                                                        />
                                                        {otp.length === 6 ? (
                                                            <Button
                                                                isIconOnly
                                                                size="lg"
                                                                color="primary"
                                                                variant="flat"
                                                                onPress={handleUpdateEntity}
                                                            >
                                                                <svg width="24" height="24" viewBox="0 0 24 24"
                                                                     fill="none"
                                                                     stroke="currentColor" strokeWidth="2">
                                                                    <path d="M20 6L9 17L4 12"/>
                                                                </svg>
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                isIconOnly
                                                                size="lg"
                                                                color="primary"
                                                                variant="flat"
                                                                onPress={async () => {
                                                                    try {
                                                                        const text = await navigator.clipboard.readText();
                                                                        // Si le texte collé contient uniquement des chiffres et a une longueur de 6 ou moins
                                                                        if (/^\d+$/.test(text) && text.length <= 6) {
                                                                            setOtp(text.substring(0, 6));
                                                                        }
                                                                    } catch (err) {
                                                                        console.error('Impossible d\'accéder au presse-papiers:', err);
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
                                                            color="primary"
                                                            variant="light"
                                                            onPress={handleResendCode}
                                                            isDisabled={resendTimer > 0}
                                                            className="text-sm"
                                                        >
                                                            {resendTimer > 0
                                                                ? `Récupérer le code dans ${resendTimer}s`
                                                                : "Récupérer le code"}
                                                        </Button>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </ModalBody>
                                )}

                                {modalStepper === "main" && (
                                    <ModalBody>
                                        <div className="flex flex-col justify-center items-start">
                                            <Stepper
                                                step={1}
                                                done={true}
                                                content={
                                                    <div className="w-full flex flex-col space-y-1">
                                                        <h1 className="text-neutral-900 dark:text-neutral-100 text-base sm:text-lg font-medium">Création
                                                            de la réservation</h1>
                                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                                            <span>Confirmation par mail à </span>
                                                            <span
                                                                className="font-medium text-neutral-900 dark:text-neutral-100">{entry?.user.email}</span>
                                                        </div>
                                                        <div
                                                            className="text-sm text-neutral-500 dark:text-neutral-500">{formatDate(entry?.createdAt)}</div>
                                                    </div>
                                                }
                                            />
                                            <Stepper
                                                step={2}
                                                content={
                                                    <div className="w-full flex flex-col space-y-1">
                                                        <h1 className="text-neutral-900 dark:text-neutral-100 text-base sm:text-lg font-medium">
                                                            Confirmation
                                                        </h1>
                                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                                            {entry.moderate !== "WAITING" && entry.moderate !== "REJECTED"
                                                                ? (
                                                                    entry.resource?.moderate
                                                                        ? `Accepté le ${formatDate(entry.lastUpdatedModerateStatus)}${entry.user ? `. ${entry.user.name} ${entry.user.surname}` : ''}`
                                                                        : `Confirmé automatiquement`
                                                                )
                                                                : ''}
                                                        </div>
                                                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                                            {entry.moderate === "WAITING" && "En attente de confirmation"}
                                                            {entry.moderate === "REJECTED" && "Refusé"}
                                                        </div>
                                                    </div>
                                                }
                                                done={entry.moderate !== "WAITING" && entry.moderate !== "REJECTED"}
                                                failed={entry.moderate === "REJECTED"}
                                                adminMode={adminMode}
                                                entry={entry}
                                            />

                                            {entry.moderate !== "BLOCKED" ? (
                                                <>
                                                    <Stepper
                                                        step={3}
                                                        content={
                                                            <div className="w-full flex flex-col space-y-2">
                                                                <h1 className="text-neutral-900 dark:text-neutral-100 text-base sm:text-lg font-medium">
                                                                    {entry.moderate === "USED" ? "En cours d'utilisation" : entry.moderate === "ACCEPTED" && new Date(entry?.endDate) < new Date() ? "Réservation expirée" : "Réservation"}
                                                                </h1>

                                                                {entry.moderate === "USED" && (
                                                                    <div
                                                                        className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                        Récupéré le {formatDate(entry.updatedAt)}
                                                                    </div>
                                                                )}

                                                                {entry.moderate !== 'USED' && (
                                                                    <div
                                                                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                                                                        <div className="flex flex-col space-y-1">
                                                                            <div
                                                                                className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                                {new Date(entry.startDate) > new Date()
                                                                                    ? (localIsAbleToPickUp()
                                                                                            ? `Récupération possible dès maintenant`
                                                                                            : `${formatDate(entry.startDate)}`
                                                                                    )
                                                                                    : `Début le ${formatDate(entry.startDate)}`}
                                                                            </div>
                                                                            {new Date(entry.startDate) <= new Date() && entry?.resource?.status === 'UNAVAILABLE' && previousNotReturned && (
                                                                                <div
                                                                                    className="text-sm text-orange-600 dark:text-orange-400">
                                                                                    Emprunteur
                                                                                    : {previousNotReturned.user?.name} {previousNotReturned.user?.surname}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {whichPickable() !== "FLUENT" && entry.moderate === "ACCEPTED" && new Date(entry?.endDate) > new Date() && (
                                                                            <Button
                                                                                isDisabled={!localIsAbleToPickUp() || hasBlockingPrevious}
                                                                                size="md"
                                                                                className="text-neutral-600 dark:text-neutral-400"
                                                                                variant="flat"
                                                                                onPress={() => handlePickUp(onClose)}
                                                                                startContent={
                                                                                    hasBlockingPrevious ? (
                                                                                        <svg className="w-4 h-4"
                                                                                             fill="none"
                                                                                             stroke="currentColor"
                                                                                             viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round"
                                                                                                  strokeLinejoin="round"
                                                                                                  strokeWidth={2}
                                                                                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/>
                                                                                        </svg>
                                                                                    ) : localIsAbleToPickUp() ? (
                                                                                        <HandRaisedIcon
                                                                                            className="w-4 h-4"/>
                                                                                    ) : waitlistCount > 0 ? (
                                                                                        <svg className="w-4 h-4"
                                                                                             fill="none"
                                                                                             stroke="currentColor"
                                                                                             viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round"
                                                                                                  strokeLinejoin="round"
                                                                                                  strokeWidth={2}
                                                                                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                                                        </svg>
                                                                                    ) : (
                                                                                        <svg className="w-4 h-4"
                                                                                             fill="none"
                                                                                             stroke="currentColor"
                                                                                             viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round"
                                                                                                  strokeLinejoin="round"
                                                                                                  strokeWidth={2}
                                                                                                  d="M6 18L18 6M6 6l12 12"/>
                                                                                        </svg>
                                                                                    )
                                                                                }
                                                                            >
                                                                                {hasBlockingPrevious
                                                                                    ? "Ressource non restituée"
                                                                                    : localIsAbleToPickUp()
                                                                                        ? "Récupérer"
                                                                                        :
                                                                                        <WaitlistInfo entry={entry}
                                                                                                      isAble={localIsAbleToPickUp()}/>}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        }
                                                        done={entry.moderate === "ENDED" || entry.moderate === "DELAYED" || entry.moderate === "REJECTED" || entry.moderate === "USED"}
                                                        failed={entry.moderate === "REJECTED" || (new Date(entry.endDate) < new Date() && (entry.moderate === "ACCEPTED" || entry.moderate === "WAITING"))}
                                                        adminMode={adminMode}
                                                    />
                                                    <Stepper
                                                        step={4}
                                                        content={
                                                            <div className="w-full flex flex-col space-y-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <h1 className="text-neutral-900 dark:text-neutral-100 text-base sm:text-lg font-medium">
                                                                        {entry.returned ? "Restitué" : "Restitution"}
                                                                    </h1>
                                                                    {entry.moderate === "USED" && new Date(entry?.endDate) < new Date() && (
                                                                        <span
                                                                            className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs">
                                                                            En retard
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                                                                    <div className="flex flex-col space-y-1">
                                                                        <div
                                                                            className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                            {entry.returned
                                                                                ? `Restitué le ${formatDate(entry?.updatedAt)}`
                                                                                : `Le ${formatDate(entry?.endDate)}`}
                                                                        </div>

                                                                        {entry.moderate === "USED" && new Date(entry?.endDate) > new Date() && (
                                                                            <CountdownTimer targetDate={entry.endDate}
                                                                                            textBefore={"dans :"}/>
                                                                        )}
                                                                    </div>

                                                                    {entry.moderate === "USED" && whichPickable() !== "FLUENT" && (
                                                                        <Button
                                                                            size="md"
                                                                            variant="flat"
                                                                            onPress={handleReturn}
                                                                            startContent={<ArrowUturnLeftIcon
                                                                                className="w-4 h-4"/>}
                                                                        >
                                                                            Restituer
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        }
                                                        adminMode={adminMode}
                                                        done={entry.moderate === "ENDED" && entry.returned}
                                                        failed={entry?.returned === false && entry.endDate <= new Date().toISOString() && entry.moderate === "USED" || entry.moderate === "REJECTED"}
                                                        last={true}
                                                    />
                                                </>
                                            ) : (
                                                <Stepper
                                                    step={3}
                                                    content={
                                                        <div
                                                            className="w-full p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                                Cette ressource est bloquée
                                                                jusqu&apos;au {formatDate(entry.endDate)}
                                                            </p>
                                                        </div>
                                                    }
                                                    last={true}
                                                    done={true}
                                                >

                                                </Stepper>
                                            )}
                                        </div>

                                        <EntryComments entry={entry} adminMode={adminMode}/>
                                    </ModalBody>
                                )}
                                <ModalFooter className='flex flex-row justify-between'>
                                    <div className="flex gap-2">
                                        {!adminMode && modalStepper === "main" && (entry.moderate === "ACCEPTED" || entry.moderate === "WAITING") && (
                                            <Tooltip color="danger" content="Annuler définitivement la réservation."
                                                     showArrow placement="right">
                                                <Button
                                                    size="lg"
                                                    color="danger"
                                                    variant="light"
                                                    onPress={() => {
                                                        setModalStepper("delete")
                                                    }}
                                                >
                                                    Annuler
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        {modalStepper === "main" && (entry.moderate === "ACCEPTED" || entry.moderate === "WAITING") && (
                                            <Button
                                                size="lg"
                                                color="underline"
                                                variant="flat"
                                                onPress={initializeEditData}
                                                className="hover:underline text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 dark:text-neutral-400 transition-all duration-300"
                                            >
                                                Modifier
                                            </Button>
                                        )}
                                    </div>
                                </ModalFooter>
                            </>
                        )}
                    </>
                )}
            </ModalContent>
        </Modal>
        </>

    )
}
