import {Modal, ModalContent, ModalHeader,} from "@heroui/react";
import {useMutation} from "@tanstack/react-query";
import ItemForm from "@/components/form/ItemForm";
import React, {useState} from "react";
import {useRefreshContext} from "@/context/RefreshContext";
import {postItem, updateItem} from "@/components/listing/ItemsOnTable.js";
import {addToast} from "@heroui/toast";
import ResourceStatusChangeModal from "@/components/modals/ResourceStatusChangeModal";

// Fonction pour vérifier s'il y a des réservations futures
const checkFutureReservations = async (resourceId) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?resourceId=${resourceId}&future=true`);
    if (!response.ok) {
        throw new Error('Erreur lors de la vérification des réservations');
    }
    const reservations = await response.json();
    return reservations.length > 0;
};

export default function ActionOnItem({isOpen, onOpenChange, action, defaultValues, formFields, model}) {
    const { refreshData } = useRefreshContext();
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [pendingStatusChange, setPendingStatusChange] = useState(null);

    const handleSuccess = () => {
        addToast({
            title: `${action === "create" ? "Création" : "Modification"} d'un élément`,
            description: `L'élément a été ${action === "create" ? "créé" : "modifié"} avec succès.`,
            color: "success"
        });
        refreshData();
    };

    const createMutation = useMutation({
        mutationFn: postItem,
        onSuccess: handleSuccess,
        onError: (error) => {
            addToast({
                title: `Erreur lors de la création de l'élément`,
                description: error.message,
                timeout: 5000,
                color: "danger"
            })
        },
    });

    const updateMutation = useMutation({
        mutationFn: updateItem,
        onSuccess: handleSuccess,
        onError: (error) => {
            if (error?.code === "MODERATED_RESOURCES_WITH_OWNER") {
                const resourcesList = error.resources
                    .map(resource => resource.name)
                    .join(', ');
                addToast({
                    title: "Action requise",
                    description: `${error.message}\n\nVeuillez modifier la modération des ressources suivantes:\n${resourcesList}`,
                    color: "danger"
                });
            } else {
                addToast({
                    title: "Erreur lors de la modification",
                    description: "Une erreur est survenue",
                    color: "danger"
                });
            }
        },
    });

    const handleFormSubmit = async (data) => {
        // Vérifier si c'est une modification de ressource et si le statut passe de AVAILABLE à UNAVAILABLE
        if (action === "edit" && model === "resources" && defaultValues?.status === "AVAILABLE" && data.status === "UNAVAILABLE") {
            try {
                // Vérifier s'il y a des réservations futures
                const hasFutureReservations = await checkFutureReservations(defaultValues.id);

                if (hasFutureReservations) {
                    // Afficher le modal de confirmation
                    setPendingStatusChange(data);
                    setShowStatusModal(true);
                    return;
                } else {
                    // Pas de réservations futures, procéder directement
                    submitData(data);
                }
            } catch (error) {
                console.error("Erreur lors de la vérification des réservations:", error);
                // En cas d'erreur, procéder directement
                submitData(data);
            }
            return;
        }

        // Procéder normalement
        submitData(data);
    };

    const submitData = (data) => {
        if(action === "create") {
            createMutation.mutate({data, model});
        } else {
            updateMutation.mutate({
                data: {
                    id: defaultValues.id,
                    ...data
                },
                model
            });
        }
    };

    const handleStatusChangeConfirm = () => {
        if (pendingStatusChange) {
            submitData(pendingStatusChange);
            setPendingStatusChange(null);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                isDismissable={false}
                backdrop="blur"
                isKeyboardDismissDisabled={true}
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
                            <ModalHeader className="flex flex-col gap-1 text-gray-900 dark:text-gray-200">
                                {action === "create" && "Créer"}
                                {action === "edit" && "Modifier"}
                            </ModalHeader>
                            <ItemForm
                                defaultValues={action==="edit" ? defaultValues : null}
                                onSubmit={handleFormSubmit}
                                onClose={onClose}
                                action={action}
                                fields={formFields}
                            />
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal de changement de statut - affiché seulement s'il y a des réservations futures */}
            <ResourceStatusChangeModal
                isOpen={showStatusModal}
                onOpenChange={setShowStatusModal}
                resource={defaultValues}
                onStatusChange={handleStatusChangeConfirm}
            />
        </>
    );
}