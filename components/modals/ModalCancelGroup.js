'use client';
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {addToast} from "@heroui/toast";

export default function ModalCancelGroup({isOpen, onOpenChange, entries, handleRefresh}) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/group/${entries[0].recurringGroupId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.details || 'Erreur lors de l\'annulation du groupe');
            }
            return response.json();
        },
        onSuccess: () => {
            handleRefresh();
            queryClient.invalidateQueries({queryKey: ['isAvailable']});
            addToast({
                title: "Groupe annulé",
                description: "Toutes les réservations du groupe ont été annulées avec succès",
                color: "success"
            });
            onOpenChange(false);
        },
        onError: (error) => {
            addToast({
                title: "Erreur",
                description: error.message || "Une erreur est survenue lors de l'annulation du groupe",
                color: "danger"
            });
        },
    });

    const handleCancel = () => {
        mutation.mutate();
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="md"
            backdrop="blur"
            classNames={{
                base: "bg-white dark:bg-neutral-900",
                header: "border-b border-neutral-200 dark:border-neutral-700",
                footer: "border-t border-neutral-200 dark:border-neutral-700"
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
                            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                Annuler le groupe de réservations
                            </h2>
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                Êtes-vous sûr de vouloir annuler toutes les réservations de ce groupe ?
                                Cette action est irréversible et
                                annulera {entries.length} réservation{entries.length > 1 ? 's' : ''}.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <div className="flex gap-2 justify-end w-full">
                                <Button
                                    color="default"
                                    variant="light"
                                    onPress={onClose}
                                >
                                    Retour
                                </Button>
                                <Button
                                    color="danger"
                                    variant="flat"
                                    onPress={handleCancel}
                                    isLoading={mutation.isPending}
                                >
                                    Annuler le groupe
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
} 