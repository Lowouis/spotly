import {
    Button,
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
    ChevronRightIcon,
    HandRaisedIcon,
    ShieldExclamationIcon
} from "@heroicons/react/24/outline";
import Stepper from "@/components/utils/Stepper";
import React, {useEffect, useState} from "react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {useEmail} from "@/context/EmailContext";
import {addToast} from "@heroui/toast";
import EntryComments from "@/components/comments/EntryComments";
import {useEntryActions} from "@/hooks/useEntryActions";


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
    console.log(isAble);
    const {count, enabled, isLoading, isError} = useWaitlistCount(entry);
    if (!enabled || isError) return null;
    if (isLoading) return <span className="text-sm text-neutral-500">...</span>;
    if (count === 0 && !isAble) {
        return "Ressource non disponible";
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

    useEffect(() => {
        if (warnSent) return;
        if (!previousNotReturned) return;
        if (new Date(previousNotReturned.endDate) >= new Date()) return;
        sendEmail({
            to: previousNotReturned.user.email,
            subject: `Attention: Retard de restitution - ${entry.resource.name}`,
            templateName: 'latePickupWarning',
            data: {
                offender: `${previousNotReturned.user.name} ${previousNotReturned.user.surname}`,
                requester: `${entry.user.name} ${entry.user.surname}`,
                resource: entry.resource.name,
                endDate: previousNotReturned.endDate,
            }
        });
        setWarnSent(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previousNotReturned, warnSent]);


        
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

    // Fonction pour gérer le renvoi du code
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

    return (
        <>
            <Tooltip content="Consulter" color="foreground" size={adminMode ? 'sm' : undefined} showArrow>
                <Button
                    className={adminMode ? "font-medium underline underline-offset-4" : undefined}
                    size={adminMode ? "sm" : "lg"}
                    variant="flat"
                    color="default"
                    isIconOnly
                    radius={adminMode ? "sm" : "lg"}
                    onPress={onOpen}
                >
                    <ChevronRightIcon
                        className="font-bold"
                        width={adminMode ? "18" : "24"}
                        height={adminMode ? "18" : "24"}
                    />
                </Button>
            </Tooltip>
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="2xl"
            onClose={() => {
                setModalStepper("main");
                setOtp("");
            }}
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
                closeButton: "text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-blue-400 rounded-full p-3 text-xl"
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
                                        <div className="flex flex-col justify-center items-center space-y-6 py-4">
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
                                                    <div className="w-full flex flex-col">
                                                        <h1 className={"text-blue-900 dark:text-blue-300 text-lg"}>Création
                                                            de la réservation</h1>
                                                        <span>Confirmation par mail à <span
                                                            className="font-semibold">{entry?.user.email}</span></span>
                                                        <span>{formatDate(entry?.createdAt)}</span>
                                                    </div>
                                                }
                                            />
                                            <Stepper
                                                step={2}
                                                content={
                                                    <div className="w-full">
                                                        <h1 className={"text-blue-900 dark:text-blue-300  text-lg"}>
                                                            Confirmation
                                                        </h1>
                                                        <span>
                                                            {entry.moderate !== "WAITING" && entry.moderate !== "REJECTED"
                                                                ? (
                                                                    entry.resource?.moderate
                                                                        ? `Accepté le ${formatDate(entry.lastUpdatedModerateStatus)}${entry.user ? `. ${entry.user.name} ${entry.user.surname}` : ''}`
                                                                        : `Confirmé automatiquement`
                                                                )
                                                                : ''}
                                                        </span>
                                                        <span>
                                                            {entry.moderate === "WAITING" && "En attente de confirmation"}
                                                            {entry.moderate === "REJECTED" && "Refuser"}
                                                        </span>
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
                                                            <div className="w-full space-y-2 ">
                                                                <h1 className="text-blue-900 dark:text-blue-300 text-lg">
                                                                    <span>{entry.moderate === "USED" ? "En cours d'utilisation" : entry.moderate === "ACCEPTED" && new Date(entry?.endDate) < new Date() ? "Réservation expirée" : "Réservation"}</span>
                                                                </h1>
                                                                {entry.moderate === "USED" && (
                                                                    <span
                                                                        className="text-neutral-600 dark:text-neutral-400">
                                                                        Récupéré le {formatDate(entry.updatedAt)}
                                                                    </span>
                                                                )}

                                                                {entry.moderate !== 'USED' && (
                                                                    <>
                                                                        <div
                                                                            className="flex flex-row justify-between items-center space-x-3">
                                                                            <div className="flex flex-col gap-1">
                                                                                <span
                                                                                    className="text-neutral-600 dark:text-neutral-400">
                                                                                    {new Date(entry.startDate) > new Date()
                                                                                        ? (localIsAbleToPickUp()
                                                                                                ? `Récupération possible dès maintenant`
                                                                                                : `${formatDate(entry.startDate)}`
                                                                                        )
                                                                                        : `Début le ${formatDate(entry.startDate)}`}
                                                                                </span>
                                                                                {new Date(entry.startDate) <= new Date() && entry?.resource?.status === 'UNAVAILABLE' && previousNotReturned && (
                                                                                    <span
                                                                                        className="text-sm text-orange-600 dark:text-orange-400">
                                                                                        Emprunteur : {previousNotReturned.user?.name} {previousNotReturned.user?.surname}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {whichPickable() !== "FLUENT" && entry.moderate === "ACCEPTED" && new Date(entry?.endDate) > new Date() && (
                                                                                <Button
                                                                                    isDisabled={!localIsAbleToPickUp() || hasBlockingPrevious}
                                                                                    size="lg"
                                                                                    className="text-neutral-600 dark:text-neutral-400"
                                                                                    variant="flat"
                                                                                    onPress={() => handlePickUp(onClose)}
                                                                                    startContent={<HandRaisedIcon
                                                                                        className="w-5 h-5"/>}
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
                                                                    </>
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
                                                            <div className="w-full space-y-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <h1 className="text-blue-900 dark:text-blue-300 text-lg">
                                                                        {entry.returned ? "Restitué" : "Restitution"}
                                                                    </h1>
                                                                    {entry.moderate === "USED" && new Date(entry?.endDate) < new Date() && (
                                                                        <span
                                                                            className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                                                                            En retard
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className="flex flex-row justify-between items-center space-x-3">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span
                                                                            className="text-neutral-600 dark:text-neutral-400">
                                                                            {entry.returned
                                                                                ? `Restitué le ${formatDate(entry?.updatedAt)}`
                                                                                : `Le ${formatDate(entry?.endDate)}`}
                                                                        </span>

                                                                        {entry.moderate === "USED" && new Date(entry?.endDate) > new Date() && (
                                                                            <CountdownTimer targetDate={entry.endDate}
                                                                                            textBefore={"dans :"}/>
                                                                        )}
                                                                    </div>

                                                                    {entry.moderate === "USED" && whichPickable() !== "FLUENT" && (
                                                                        <Button
                                                                            size="lg"
                                                                            variant="flat"
                                                                            onPress={handleReturn}
                                                                            startContent={<ArrowUturnLeftIcon
                                                                                className="w-5 h-5"/>}
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
                                                            className="w-full p-3 my-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                            <p className="text-sm text-red-600 dark:text-red-400 ">
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
                                    {!adminMode && modalStepper === "main" && (entry.moderate === "ACCEPTED" || entry.moderate === "WAITING") && (
                                        <Tooltip color="danger" content="Annuler définitivement la réservation."
                                                 showArrow placement="right">
                                            <Button
                                                size={"lg"}
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
