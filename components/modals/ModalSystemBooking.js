import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@heroui/react";
import {formatDuration} from "@/global";
import {CalendarIcon, ClockIcon, ShieldExclamationIcon, TrashIcon, UserIcon} from "@heroicons/react/24/outline";
import {useState} from "react";
import {addToast} from "@heroui/toast";
import {useMutation} from "@tanstack/react-query";

export default function ModalSystemBooking({entry, isOpen, onOpenChange, handleRefresh}) {
    const {isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose} = useDisclosure();
    const [isDeleting, setIsDeleting] = useState(false);
    const startDate = new Date(entry.startDate);
    const endDate = new Date(entry.endDate);
    const duration = endDate - startDate;

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression');
            }
            return response.json();
        },
        onSuccess: () => {
            onConfirmClose();
            onOpenChange(false);
            addToast({
                title: "Blocage supprimé",
                description: "Le blocage a été supprimé avec succès",
                type: "success",
            });
        },
        onError: (error) => {
            addToast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la suppression du blocage",
                type: "error",
            });
            console.error(error);
        },
        onSettled: () => {
            setIsDeleting(false);
            handleRefresh();
        }
    });
    const handleDelete = () => {
        setIsDeleting(true);
        deleteMutation.mutate(entry.id);
    };

    if (!entry) return null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="md"
                backdrop="blur"
                classNames={{
                    base: "bg-white dark:bg-neutral-900",
                    header: "border-b border-neutral-200 dark:border-neutral-700 pb-4",
                    body: "py-6",
                    footer: "border-t border-neutral-200 dark:border-neutral-700 pt-4",
                    closeButton: "text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full p-3 text-xl"
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
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-full bg-danger-100 dark:bg-danger-900/30">
                                        <ShieldExclamationIcon
                                            className="w-5 h-5 text-danger-600 dark:text-danger-400"/>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                            Ressource bloquée
                                        </h2>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            {entry.resource?.name}
                                        </p>
                                    </div>
                                </div>
                            </ModalHeader>

                            <ModalBody>
                                <div className="space-y-6">
                                    {/* Informations sur le blocage */}
                                    <div
                                        className="p-4 bg-danger-50 dark:bg-danger-950/30 rounded-lg border border-danger-200 dark:border-danger-800/30">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-full bg-danger-100 dark:bg-danger-900/50">
                                                <ShieldExclamationIcon
                                                    className="w-5 h-5 text-danger-600 dark:text-danger-400"/>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-danger-700 dark:text-danger-300">
                                                    Blocage administratif
                                                </h3>
                                                <p className="text-sm text-danger-600 dark:text-danger-400 mt-1">
                                                    Cette ressource a été bloquée par un administrateur pour la période
                                                    spécifiée.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Détails de la période */}
                                    <div className="space-y-4">
                                        <div
                                            className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                            <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-700">
                                                <CalendarIcon
                                                    className="w-5 h-5 text-neutral-600 dark:text-neutral-400"/>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                    Période de blocage
                                                </h3>
                                                <div className="mt-1 space-y-1">
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                        Début : {startDate.toLocaleString("fr-FR", {
                                                        weekday: "long",
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                    </p>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                        Fin : {endDate.toLocaleString("fr-FR", {
                                                        weekday: "long",
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                            <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-700">
                                                <ClockIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400"/>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                    Durée
                                                </h3>
                                                <div className="mt-1">
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                                        {formatDuration(duration)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {entry.comment && (
                                            <div
                                                className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                                <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-700">
                                                    <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400"
                                                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              strokeWidth={2}
                                                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                                                    </svg>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                        Commentaire
                                                    </h3>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                                        {entry.comment}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {entry.user && (
                                            <div
                                                className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                                                <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-700">
                                                    <UserIcon
                                                        className="w-5 h-5 text-neutral-600 dark:text-neutral-400"/>
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                        Administrateur
                                                    </h3>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                                        {entry.user.name} {entry.user.surname}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ModalBody>

                            <ModalFooter className="flex justify-between">
                                <Button
                                    color="danger"
                                    variant="flat"
                                    onPress={handleDelete}
                                    isLoading={isDeleting}
                                    startContent={<TrashIcon className="w-4 h-4"/>}
                                    className="font-medium"
                                >
                                    Supprimer le blocage
                                </Button>
                                <Button
                                    color="default"
                                    variant="light"
                                    onPress={onClose}
                                    className="font-medium"
                                >
                                    Fermer
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal de confirmation */}
            <Modal
                isOpen={isConfirmOpen}
                onOpenChange={onConfirmClose}
                size="sm"
                backdrop="blur"
                classNames={{
                    base: "bg-white dark:bg-neutral-900",
                    header: "border-b border-neutral-200 dark:border-neutral-700 pb-4",
                    body: "py-6",
                    footer: "border-t border-neutral-200 dark:border-neutral-700 pt-4",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-full bg-danger-100 dark:bg-danger-900/30">
                                        <TrashIcon className="w-5 h-5 text-danger-600 dark:text-danger-400"/>
                                    </div>
                                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                        Confirmer la suppression
                                    </h2>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-neutral-600 dark:text-neutral-400">
                                    Êtes-vous sûr de vouloir supprimer ce blocage administratif ? Cette action est
                                    irréversible.
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="default"
                                    variant="light"
                                    onPress={onClose}
                                    className="font-medium"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    color="danger"
                                    variant="flat"
                                    onPress={handleDelete}
                                    isLoading={isDeleting}
                                    className="font-medium"
                                >
                                    Supprimer
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
} 