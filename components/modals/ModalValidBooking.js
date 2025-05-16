'use client';
import {Button} from "@nextui-org/button";
import {
    Autocomplete,
    AutocompleteItem,
    Checkbox,
    Divider,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Skeleton,
    Spinner,
    Textarea,
    Tooltip
} from "@nextui-org/react";
import {formatDate} from "@/components/modals/ModalCheckingBooking";
import {formatDuration, lastestPickable, whoIsOwner} from "@/global";
import {ArrowLeftIcon, ArrowRightCircleIcon} from "@heroicons/react/24/solid";
import React, {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useEmail} from "@/context/EmailContext";
import {getEmailTemplate} from "@/utils/mails/templates";
import {addToast} from "@heroui/toast";
import {getAllUsers} from "@/utils/api"


export default function ModalValidBooking({entry, isOpen, onOpenChange, session, handleRefresh}) {
    const [submitted, setSubmitted] = useState(false);

    const {data: users = [], isLoading} = useQuery({
        queryKey: ['users'],
        queryFn: getAllUsers,
    });
    
    const [formData, setFormData] = useState({
        comment: "",
        cgu: false,
        substitute_user: null,
        makeUnavailable: false,
    });


    const { mutate: sendEmail } = useEmail();
    const queryClient = useQueryClient();

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === "checkbox" ? checked : value
        }));
    };
    const mutation = useMutation({
        mutationFn: async (newEntry) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEntry),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.details || 'Failed to create entry');
            }
            return data;
        },
        onSuccess: (data, variables, context) => {
            setSubmitted(true);
            handleRefresh();
            queryClient.invalidateQueries({queryKey: ['isAvailable']})

            // On prend la première entrée pour l'envoi des emails
            const firstEntry = Array.isArray(data) ? data[0] : data;
            if (!firstEntry) {
                console.error("Aucune entrée retournée par l'API");
                return;
            }

            if (firstEntry.moderate === "WAITING") {
                const owner = whoIsOwner(firstEntry);
                sendEmail({
                    "to": firstEntry.user.email,
                    "subject": "Demande de réservation Spotly - " + firstEntry.resource.name,
                    "text": getEmailTemplate("groupReservationWaiting",
                        {
                            name: session.user.surname,
                            resource: firstEntry.resource.name,
                            domain: firstEntry.resource.domains.name,
                            startDate: new Date(firstEntry.startDate).toLocaleString("FR-fr", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric"
                            }),
                            endDate: new Date(firstEntry.endDate).toLocaleString("FR-fr", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric"
                            }),
                            owner: owner.name + " " + owner.surname,
                        })
                });
                sendEmail({
                    "to": owner.email,
                    "subject": "Nouvelle demande de réservation Spotly - " + firstEntry.resource.name,
                    "text": getEmailTemplate("groupReservationRequestOwner",
                        {
                            user: firstEntry.user.surname,
                            resource: firstEntry.resource.name,
                            entries: entry,
                            owner : owner.name + " " + owner.surname,
                            domain: firstEntry.resource.domains.name,
                            startDate: new Date(firstEntry.startDate).toLocaleString("FR-fr", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric"
                            }),
                            endDate: new Date(firstEntry.endDate).toLocaleString("FR-fr", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric"
                            }),
                        })
                });
            } else {
                // Pour les réservations non modérées, on envoie un seul email pour le groupe
                if (data.length > 0) {
                    sendEmail({
                        "to": data[0].user.email,
                        "subject": "Nouvelles réservations Spotly - " + data[0].resource.name,
                        "text": getEmailTemplate("groupReservationAccepted",
                            {
                                user: data[0].user.name + " " + data[0].user.surname,
                                resource: data[0].resource.name,
                                entries: data.map(entry => ({
                                    startDate: entry.startDate,
                                    endDate: entry.endDate,
                                    returnedConfirmationCode: entry.returnedConfirmationCode
                                }))
                            }
                        )
                    });
                }
            }
            addToast({
                title: "Nouvelle réservation",
                description: `Votre ${firstEntry.moderate === "WAITING" ? "demande" : "réservation"} est bien enregistrée, un mail de confirmation a été envoyé à ${session.user.email}`,
                color: "success"
            });
            console.log("Fin du mutate");
        },
        onError: (error) => {
            console.error("Erreur lors de la mutation:", error);
            addToast({
                title: "Erreur : Nouvelle réservation",
                description: error.message || "La réservation n'a pas pu être effectuée. Si le problème persiste merci de contacter un administrateur.",
                color : "danger"
            });
        },
    });

    const handleSubmission = (onClose) => {
        if (formData.cgu || formData.makeUnavailable) {
            mutation.mutate({
                availabilities: entry.resource.availability,
                resourceId: entry.resource.id,
                userId: formData.substitute_user ? formData.substitute_user : session.user.id,
                comment: formData.comment,
                moderate: entry.resource.moderate && !formData.makeUnavailable ? "WAITING" : "ACCEPTED",
                system: !!formData.makeUnavailable,
            }, {
                onSuccess: () => {
                    onClose();
                }
            });
        }
    };

    return (
        <Modal
            scrollBehavior="inside"
            isDismissable={true}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="center"
            backdrop="blur"
            size="2xl"
            classNames={{
                base: "bg-white dark:bg-neutral-900",
                header: "border-b border-neutral-200 dark:border-neutral-700 pb-4",
                body: "py-6",
                footer: "border-t border-neutral-200 dark:border-neutral-700 pt-4 sticky bottom-0 bg-white dark:bg-neutral-900 rounded-b-lg",
                wrapper: "overflow-hidden rounded-lg",
                closeButton: "hidden"
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
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        {!submitted && (
                            <form onSubmit={(e)=> {
                                e.preventDefault();
                                handleSubmission(onClose);
                            }} className="flex flex-col h-full">
                                <Skeleton isLoaded={entry.resource}>
                                    <ModalHeader className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Tooltip content="Retour" color="foreground" showArrow>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        onPress={onClose}
                                                        className="text-neutral-600 dark:text-neutral-400 -ml-2"
                                                    >
                                                        <ArrowLeftIcon className="w-5 h-5"/>
                                                    </Button>
                                                </Tooltip>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                                            {entry && entry.resource ? entry.resource.name :
                                                                <Spinner size="sm"/>}
                                                        </h2>
                                                        {entry?.resource?.moderate && (
                                                            <span
                                                                className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                                                Modération requise
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                        {entry?.resource?.domains?.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </ModalHeader>
                                </Skeleton>

                                <Skeleton isLoaded={entry.resource}>
                                    <ModalBody className="flex-1 overflow-y-auto max-h-[70vh]">
                                        <div className="flex flex-col space-y-6">
                                            {/* Section Dates */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                        Période de réservation
                                                    </h3>
                                                    {entry?.resource?.availability && (
                                                        <span
                                                            className="text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                                            {entry.resource.availability.filter(slot => slot.available).length}/{entry.resource.availability.length} créneaux disponibles
                                                        </span>
                                                    )}
                                                </div>

                                                <div
                                                    className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                                    {entry.resource?.availability.length === 1 ? (
                                                        <div
                                                            className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-700">
                                                                    <svg
                                                                        className="w-5 h-5 text-neutral-600 dark:text-neutral-400"
                                                                        fill="none" stroke="currentColor"
                                                                        viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round"
                                                                              strokeLinejoin="round" strokeWidth={2}
                                                                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                                    </svg>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span
                                                                        className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                                        {formatDate(entry.date.start)}
                                                                    </span>
                                                                    <span
                                                                        className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                        {formatDate(entry.date.end)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                    {formatDuration(new Date(entry.date.end) - new Date(entry.date.start))}
                                                                </span>
                                                                <ArrowRightCircleIcon
                                                                    className="w-5 h-5 text-neutral-400"/>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {entry.resource?.availability?.map((slot, index) => (
                                                                <div
                                                                    key={index}
                                                                    className={`
                                                                        flex items-center justify-between p-4 rounded-lg
                                                                        ${slot.available
                                                                        ? 'bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800/30'
                                                                        : 'bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800/30'
                                                                    }
                                                                        transition-colors duration-200
                                                                    `}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`
                                                                            p-2 rounded-full
                                                                            ${slot.available
                                                                            ? 'bg-success-100 dark:bg-success-900/50'
                                                                            : 'bg-danger-100 dark:bg-danger-900/50'
                                                                        }
                                                                        `}>
                                                                            <svg
                                                                                className={`w-5 h-5 ${slot.available ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}
                                                                                fill="none" stroke="currentColor"
                                                                                viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round"
                                                                                      strokeLinejoin="round"
                                                                                      strokeWidth={2}
                                                                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                                            </svg>
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span
                                                                                className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                                                {formatDate(slot.start)}
                                                                            </span>
                                                                            <span
                                                                                className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                                {formatDate(slot.end)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span
                                                                            className={`text-sm ${slot.available ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                                                                            {slot.available ? 'Disponible' : 'Indisponible'}
                                                                        </span>
                                                                        <ArrowRightCircleIcon
                                                                            className={`w-5 h-5 ${slot.available ? 'text-success-400' : 'text-danger-400'}`}/>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <style jsx global>{`
                                                .custom-scrollbar::-webkit-scrollbar {
                                                    width: 6px;
                                                }

                                                .custom-scrollbar::-webkit-scrollbar-track {
                                                    background: transparent;
                                                }

                                                .custom-scrollbar::-webkit-scrollbar-thumb {
                                                    background-color: rgba(156, 163, 175, 0.3);
                                                    border-radius: 3px;
                                                }

                                                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                                                    background-color: rgba(75, 85, 99, 0.3);
                                                }
                                            `}</style>

                                            <Divider className="bg-neutral-200 dark:bg-neutral-700"/>

                                            {/* Section Commentaire */}
                                            <div className="space-y-2">
                                                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                    Commentaire
                                                </h3>
                                                <Textarea
                                                    name="comment"
                                                    id="comment"
                                                    placeholder="Ajouter un commentaire à votre réservation..."
                                                    size="lg"
                                                    variant="bordered"
                                                    className="w-full min-h-[100px]"
                                                    onChange={handleInputChange}
                                                    classNames={{
                                                        input: "text-sm",
                                                        label: "text-sm font-medium"
                                                    }}
                                                />
                                            </div>

                                            {/* Section Options Admin */}
                                            {session?.user?.role === "SUPERADMIN" && (
                                                <>
                                                    <div className="space-y-4">
                                                        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                            Options administrateur
                                                        </h3>

                                                        {!formData.makeUnavailable && (
                                                            <div className="space-y-2">
                                                                <label
                                                                    className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                    Réserver pour un autre utilisateur
                                                                </label>
                                                                <Autocomplete
                                                                    placeholder="Rechercher par nom ou prénom"
                                                                    className="w-full"
                                                                    size="lg"
                                                                    radius="sm"
                                                                    defaultItems={users}
                                                                    isLoading={isLoading}
                                                                    variant="bordered"
                                                                    onSelectionChange={(substitute_user) => {
                                                                        setFormData(prevState => ({
                                                                            ...prevState,
                                                                            substitute_user
                                                                        }));
                                                                    }}
                                                                    labelPlacement="outside"
                                                                    isVirtualized={false}
                                                                    inputProps={{
                                                                        classNames: {
                                                                            input: "text-sm",
                                                                            label: "text-sm font-medium"
                                                                        }
                                                                    }}
                                                                    onInputChange={(value) => {
                                                                        const searchText = value.toLowerCase();
                                                                        return users.filter(user =>
                                                                            user.name.toLowerCase().includes(searchText) ||
                                                                            user.surname.toLowerCase().includes(searchText) ||
                                                                            user.email.toLowerCase().includes(searchText) ||
                                                                            `${user.name} ${user.surname}`.toLowerCase().includes(searchText)
                                                                        );
                                                                    }}
                                                                >
                                                                    {(user) => (
                                                                        <AutocompleteItem
                                                                            key={user.id}
                                                                            textValue={`${user.name} ${user.surname}`}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm font-medium">
                                                                                    {user.name} {user.surname}
                                                                                </span>
                                                                                <span
                                                                                    className="text-xs text-neutral-500">
                                                                                    {user.email}
                                                                                </span>
                                                                            </div>
                                                                        </AutocompleteItem>
                                                                    )}
                                                                </Autocomplete>
                                                            </div>
                                                        )}

                                                        <div
                                                            className="flex items-center p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                                            <Checkbox
                                                                size="sm"
                                                                color="danger"
                                                                className="text-sm"
                                                                checked={formData.makeUnavailable}
                                                                onChange={handleInputChange}
                                                                name="makeUnavailable"
                                                            >
                                                                Bloquer la ressource
                                                            </Checkbox>
                                                        </div>
                                                    </div>
                                                    <Divider className="bg-neutral-200 dark:bg-neutral-700"/>
                                                </>
                                            )}
                                            {!formData.makeUnavailable && 
                                            <div className="space-y-4">
                                                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                    Conditions d&apos;utilisation
                                                </h3>
                                                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                                        {lastestPickable(entry)?.cgu}
                                                    </p>
                                                    <Checkbox
                                                        id="cgu"
                                                        name="cgu"
                                                        required
                                                        onChange={handleInputChange}
                                                        radius="sm"
                                                        color="default"
                                                        size="sm"
                                                        value={formData.cgu}
                                                        classNames={{
                                                            label: "text-sm text-neutral-700 dark:text-neutral-300"
                                                        }}
                                                    >
                                                        J&apos;accepte les conditions d&apos;utilisation
                                                    </Checkbox>
                                                </div>
                                            </div>}
                                        </div>
                                    </ModalBody>
                                </Skeleton>

                                <ModalFooter>
                                    <Skeleton isLoaded={entry.resource}>
                                        <div className="flex flex-row gap-2">
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                type="submit"
                                                size="lg"
                                                className="font-medium"
                                                isDisabled={!formData.cgu && !formData.makeUnavailable}
                                            >
                                                {!formData.makeUnavailable ? !entry.resource.moderate ? "Réserver" : "Demander" : "Bloquer"}
                                            </Button>
                                        </div>
                                    </Skeleton>
                                </ModalFooter>
                            </form>
                        )}
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}