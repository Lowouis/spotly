'use client';
import {Button} from "@/components/ui/button";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from "@/components/ui/combobox";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Checkbox} from "@/components/ui/checkbox";
import {ProgressDemo} from "@/components/ui/progress";
import {Spinner} from "@/components/ui/spinner";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {formatDate} from "@/components/modals/ModalCheckingBooking";
import {formatDuration, whoIsOwner} from "@/global";
import {ArrowLeftIcon, ArrowRightCircleIcon} from "@heroicons/react/24/solid";
import React, {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useEmail} from "@/features/shared/context/EmailContext";
import {addToast} from "@/lib/toast";
import {getAllUsers} from "@/services/client/api"
import {getEffectivePickable, requiresPickupCode} from "@/services/client/reservationModes";

const ModalTooltip = ({content, children}) => (
    <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
    </Tooltip>
);


export default function ModalValidBooking({entry, isOpen, onOpenChange, session, handleRefresh}) {
    const [submitted, setSubmitted] = useState(false);

    const {data: users = [], isLoading} = useQuery({
        queryKey: ['users'],
        queryFn: getAllUsers,
    });
    
    const [formData, setFormData] = useState({
        cgu: false,
        substitute_user: null,
        makeUnavailable: false,
        selectedSlots: [], // Nouveau: pour stocker les créneaux sélectionnés
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

    // Initialiser les créneaux sélectionnés avec tous les créneaux disponibles
    const availabilitySignature = React.useMemo(() => {
        if (!entry?.resource?.availability) return "";

        return entry.resource.availability
            .map((slot) => `${slot.start}-${slot.end}-${slot.available}`)
            .join("|");
    }, [entry?.resource?.availability]);

    React.useEffect(() => {
        if (!isOpen || !entry?.resource?.availability) return;

        const availableSlots = entry.resource.availability
            .map((slot, index) => ({...slot, index}))
            .filter(slot => slot.available);

        setFormData(prevState => {
            const currentSignature = prevState.selectedSlots
                .map((slot) => `${slot.start}-${slot.end}-${slot.available}`)
                .join("|");
            const nextSignature = availableSlots
                .map((slot) => `${slot.start}-${slot.end}-${slot.available}`)
                .join("|");

            if (currentSignature === nextSignature) return prevState;

            return {
                ...prevState,
                selectedSlots: availableSlots
            };
        });
    }, [availabilitySignature, entry?.resource?.availability, isOpen]);

    const handleSlotSelection = (slot, index) => {
        if (!slot.available) return; // Ne pas permettre la sélection des créneaux indisponibles

        setFormData(prevState => {
            const isSelected = prevState.selectedSlots.some(selectedSlot =>
                selectedSlot.start === slot.start && selectedSlot.end === slot.end
            );

            if (isSelected) {
                // Retirer le créneau
                return {
                    ...prevState,
                    selectedSlots: prevState.selectedSlots.filter(selectedSlot =>
                        !(selectedSlot.start === slot.start && selectedSlot.end === slot.end)
                    )
                };
            } else {
                // Ajouter le créneau
                return {
                    ...prevState,
                    selectedSlots: [...prevState.selectedSlots, {...slot, index}]
                };
            }
        });
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
                const entriesArray = Array.isArray(data) ? data : [data];
                const userFullName = `${firstEntry.user.name} ${firstEntry.user.surname}`;
                // Email to requester (user)
                sendEmail({
                    to: firstEntry.user.email,
                    subject: "Demande de réservation Spotly - " + firstEntry.resource.name,
                    templateName: entriesArray.length > 1 ? "groupReservationWaiting" : "reservationRequestUser",
                    data: entriesArray.length > 1
                        ? {
                            user: userFullName,
                            resource: firstEntry.resource.name,
                            entries: entriesArray,
                        }
                        : {
                            name: userFullName,
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
                            comment: firstEntry.comment,
                        }
                });

                // Email to owner
                sendEmail({
                    to: owner.email,
                    subject: "Nouvelle demande de réservation Spotly - " + firstEntry.resource.name,
                    templateName: entriesArray.length > 1 ? "groupReservationRequestOwner" : "reservationRequestOwner",
                    data: entriesArray.length > 1
                        ? {
                            user: userFullName,
                            resource: firstEntry.resource.name,
                            entries: entriesArray,
                        }
                        : {
                            user: userFullName,
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
                            comment: firstEntry.comment,
                        },
                });
            } else {
                // Pour les réservations non modérées, on envoie un seul email pour le groupe
                if (data.length > 0) {
                    sendEmail({
                        to: data[0].user.email,
                        subject: "Nouvelles réservations Spotly - " + data[0].resource.name,
                        templateName: "groupReservationAccepted",
                        data: {
                                user: data[0].user.name + " " + data[0].user.surname,
                                resource: data[0].resource.name,
                                entries: data.map(entry => ({
                                    id: entry.id,
                                    startDate: entry.startDate,
                                    endDate: entry.endDate,
                                    returnedConfirmationCode: entry.returnedConfirmationCode,
                                    isCode: requiresPickupCode(entry),
                                    comment: entry.comment,
                                    adminNote: entry.adminNote,
                                })),
                            }
                    });
                }
            }
            addToast({
                title: "Nouvelle réservation",
                description: `Votre ${firstEntry.moderate === "WAITING" ? "demande" : "réservation"} est bien enregistrée, un mail de confirmation a été envoyé à ${firstEntry.user.email}`,
                color: "success"
            });
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
        if ((formData.cgu && formData.selectedSlots.length > 0) || formData.makeUnavailable) {
            // Utiliser seulement les créneaux sélectionnés
            const selectedAvailabilities = formData.selectedSlots.map(slot => ({
                start: slot.start,
                end: slot.end,
                available: slot.available
            }));
            
            mutation.mutate({
                availabilities: selectedAvailabilities,
                resourceId: entry.resource.id,
                userId: formData.substitute_user ? formData.substitute_user : session.user.id,
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
        <TooltipProvider>
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="mx-1 max-w-2xl overflow-hidden border border-[#e2e8f0] bg-white p-0 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
                <DialogTitle className="sr-only">
                    {entry?.resource?.name ? `Réservation ${entry.resource.name}` : 'Réservation'}
                </DialogTitle>
                {(() => {
                    const onClose = () => onOpenChange(false);
                    return (
                    <>
                        {!submitted && (
                            <form onSubmit={(e)=> {
                                e.preventDefault();
                                handleSubmission(onClose);
                            }} className="flex flex-col h-full">
                                {entry.resource ? (
                                    <DialogHeader className="flex flex-col gap-1 border-b border-[#e2e8f0] bg-white px-6 py-3 pr-12 dark:border-neutral-800 dark:bg-neutral-950 sm:py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <ModalTooltip content="Retour">
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={onClose}
                                                        className="-ml-2 text-[#4b5563] hover:bg-[#f4f7fb] hover:text-[#111827] dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
                                                    >
                                                        <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                                                    </Button>
                                                </ModalTooltip>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                                        <h2 className="truncate text-lg font-black text-[#111827] dark:text-neutral-100 sm:text-xl">
                                                            {entry && entry.resource ? entry.resource.name :
                                                                <Spinner size="sm"/>}
                                                        </h2>
                                                        {entry?.resource?.moderate && (
                                                            <span
                                                                 className="flex-shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800/40 sm:px-2 sm:py-1">
                                                                Modération requise
                                                            </span>
                                                        )}
                                                    </div>
                                                     <p className="truncate text-xs font-medium text-[#6b7585] dark:text-neutral-400 sm:text-sm">
                                                        {entry?.resource?.domains?.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </DialogHeader>
                                ) : <div className="m-4 flex h-16 items-center justify-center"><ProgressDemo /></div>}

                                {entry.resource ? (
                                    <div className="max-h-[60vh] flex-1 overflow-y-auto bg-[#fbfcff] px-6 py-3 dark:bg-neutral-950 sm:max-h-[70vh] sm:py-4">
                                        <div className="flex flex-col space-y-4 sm:space-y-6">
                                            {/* Section Dates */}
                                            <div className="space-y-3 sm:space-y-4">
                                                <div className="flex items-center justify-between">
                                                     <h3 className="text-base font-bold text-[#3f4652] dark:text-neutral-200">
                                                        Période de réservation
                                                    </h3>
                                                    {entry?.resource?.availability && (
                                                        <span
                                                             className="rounded-full bg-[#f1f3f6] px-2.5 py-1 text-xs font-bold text-[#5f6b7a] dark:bg-neutral-900 dark:text-neutral-300">
                                                            {formData.selectedSlots.length}/{entry.resource.availability.filter(slot => slot.available).length} créneaux sélectionnés
                                                        </span>
                                                    )}
                                                </div>

                                                <div
                                                    className="max-h-[180px] sm:max-h-[200px] overflow-y-auto pr-2 space-y-1.5 sm:space-y-2 custom-scrollbar">
                                                    {entry.resource?.availability.length === 1 ? (
                                                        <div
                                                             className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-4">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div
                                                                     className="rounded-full bg-[#f1f3f6] p-1.5 dark:bg-neutral-900 sm:p-2">
                                                                    <svg
                                                                         className="h-4 w-4 text-[#6b7585] dark:text-neutral-400 sm:h-5 sm:w-5"
                                                                        fill="none" stroke="currentColor"
                                                                        viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round"
                                                                              strokeLinejoin="round" strokeWidth={2}
                                                                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                                    </svg>
                                                                </div>
                                                                <div className="flex flex-col min-w-0 flex-1">
                                                                    <span
                                                                         className="truncate text-xs font-bold text-[#111827] dark:text-neutral-100 sm:text-sm">
                                                                        {formatDate(entry.date.start)}
                                                                    </span>
                                                                    <span
                                                                         className="truncate text-xs font-medium text-[#6b7585] dark:text-neutral-400">
                                                                        {formatDate(entry.date.end)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div
                                                                className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                                <span
                                                                     className="text-xs font-medium text-[#6b7585] dark:text-neutral-400 sm:text-sm">
                                                                    {formatDuration(new Date(entry.date.end) - new Date(entry.date.start))}
                                                                </span>
                                                                <ArrowRightCircleIcon
                                                                     className="h-4 w-4 text-[#8a94a6] sm:h-5 sm:w-5"/>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1.5 sm:space-y-2">
                                                            {entry.resource?.availability?.map((slot, index) => {
                                                                const isSelected = formData.selectedSlots.some(selectedSlot =>
                                                                    selectedSlot.start === slot.start && selectedSlot.end === slot.end
                                                                );

                                                                return (
                                                                    <div
                                                                        key={index}
                                                                        className={`
                                                                            flex items-center justify-between p-3 sm:p-4 rounded-lg cursor-pointer
                                                                            ${slot.available
                                                                            ? `${isSelected ? 'border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/20 dark:ring-emerald-900/30' : 'border-[#e2e8f0] bg-white hover:border-emerald-200 hover:bg-[#fbfcff] dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-emerald-900/50 dark:hover:bg-neutral-900'}`
                                                                            : 'border-[#e2e8f0] bg-[#f8fafc] opacity-75 dark:border-neutral-800 dark:bg-neutral-900/60'
                                                                        }
                                                                            border shadow-sm transition-colors duration-200
                                                                        `}
                                                                        onClick={() => handleSlotSelection(slot, index)}
                                                                    >
                                                                        <div
                                                                            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                                            <Checkbox
                                                                                checked={isSelected}
                                                                                disabled={!slot.available}
                                                                                className="flex-shrink-0"
                                                                                onCheckedChange={() => handleSlotSelection(slot, index)}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            />
                                                                            <div
                                                                                className="flex flex-col min-w-0 flex-1">
                                                                                <span
                                                                                     className="truncate text-xs font-bold text-[#111827] dark:text-neutral-100 sm:text-sm">
                                                                                    {formatDate(slot.start)}
                                                                                </span>
                                                                                <span
                                                                                     className="truncate text-xs font-medium text-[#6b7585] dark:text-neutral-400">
                                                                                    {formatDate(slot.end)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div
                                                                            className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                                            <span
                                                                                 className={`text-xs font-bold sm:text-sm ${slot.available ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#5f6b7a] dark:text-neutral-400'}`}>
                                                                                {slot.available ? 'Disponible' : 'Indisponible'}
                                                                            </span>
                                                                            <span
                                                                                 className="text-xs font-medium text-[#6b7585] dark:text-neutral-400">
                                                                                {formatDuration(new Date(slot.end) - new Date(slot.start))}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
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

                                            {/* Section Options Admin */}
                                            {session?.user?.role === "SUPERADMIN" && (
                                                <>
                                                    <Accordion>
                                                        <AccordionItem>
                                                            <AccordionTrigger>Options administrateur</AccordionTrigger>
                                                            <AccordionContent>
                                                                <div className="space-y-4">
                                                                    {!formData.makeUnavailable && (
                                                                        <div className="space-y-2">
                                                                            <label className="text-sm text-neutral-600 dark:text-neutral-400">
                                                                                Réserver pour un autre utilisateur
                                                                            </label>
                                                                            <Combobox
                                                                                items={isLoading ? [] : users}
                                                                                value={formData.substitute_user || ""}
                                                                                onValueChange={(userId) => setFormData(prevState => ({
                                                                                    ...prevState,
                                                                                    substitute_user: userId || null
                                                                                }))}
                                                                                itemToValue={(user) => user.id.toString()}
                                                                                itemToString={(user) => `${user.name} ${user.surname} - ${user.email}`}
                                                                            >
                                                                                <ComboboxInput placeholder="Rechercher par nom ou prénom" />
                                                                                <ComboboxContent>
                                                                                    <ComboboxEmpty>Aucun utilisateur trouvé</ComboboxEmpty>
                                                                                    <ComboboxList>
                                                                                        {(user) => (
                                                                                            <ComboboxItem key={user.id} value={user.id.toString()}>
                                                                                                {user.name} {user.surname} - {user.email}
                                                                                            </ComboboxItem>
                                                                                        )}
                                                                                    </ComboboxList>
                                                                                </ComboboxContent>
                                                                            </Combobox>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center rounded-xl border border-[#e2e8f0] bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                                                                        <label className="flex items-center gap-2 text-sm font-medium text-[#3f4652] dark:text-neutral-200">
                                                                            <Checkbox
                                                                                checked={formData.makeUnavailable}
                                                                                onCheckedChange={(checked) => handleInputChange({target: {name: "makeUnavailable", type: "checkbox", checked: Boolean(checked)}})}
                                                                                name="makeUnavailable"
                                                                            />
                                                                            Bloquer la ressource
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                     <div className="h-px bg-[#e2e8f0] dark:bg-neutral-800"/>
                                                </>
                                            )}
                                            {!formData.makeUnavailable &&
                                                <div className="space-y-3 sm:space-y-4">
                                                <h3 className="text-base font-bold text-[#3f4652] dark:text-neutral-200">
                                                    Conditions d&apos;utilisation
                                                </h3>
                                                    <div
                                                         className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-5">
                                                         <p className="mb-0 text-sm font-medium leading-7 text-[#5f6b7a] dark:text-neutral-400 sm:text-base">
                                                        {getEffectivePickable(entry)?.cgu}
                                                    </p>
                                                 </div>
                                             </div>}
                                         </div>
                                     </div>
                                 ) : <div className="mx-4 flex h-80 items-center justify-center"><ProgressDemo /></div>}

                                <DialogFooter className="sticky bottom-0 border-t border-[#e2e8f0] bg-white px-6 py-3 dark:border-neutral-800 dark:bg-neutral-950 sm:py-4">
                                     {entry.resource ? (
                                         <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                             {!formData.makeUnavailable ? (
                                                  <label className="flex items-center gap-2 text-xs font-medium text-[#3f4652] dark:text-neutral-300 sm:text-sm">
                                                     <Checkbox
                                                         id="cgu"
                                                         name="cgu"
                                                         required
                                                         checked={formData.cgu}
                                                         onCheckedChange={(checked) => handleInputChange({target: {name: "cgu", type: "checkbox", checked: Boolean(checked)}})}
                                                     />
                                                     J&apos;accepte les conditions d&apos;utilisation
                                                 </label>
                                             ) : <span />}
                                             <Button
                                                 type="submit"
                                                  className="h-11 w-full rounded-xl bg-[#111827] px-6 font-bold text-white hover:bg-[#1f2937] dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200 sm:w-auto"
                                                 disabled={(!formData.cgu || formData.selectedSlots.length === 0) && !formData.makeUnavailable}
                                             >
                                                {!formData.makeUnavailable ? !entry.resource.moderate ? "Réserver" : "Demander" : "Bloquer"}
                                            </Button>
                                        </div>
                                    ) : <div className="flex h-10 w-32 items-center justify-center"><ProgressDemo /></div>}
                                </DialogFooter>
                            </form>
                        )}
                    </>
                    );
                })()}
            </DialogContent>
        </Dialog>
        </TooltipProvider>
    );
}
