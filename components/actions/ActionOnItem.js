import {useMutation} from "@tanstack/react-query";
import ItemForm from "@/components/form/ItemForm";
import React, {useState} from "react";
import {useRefreshContext} from "@/features/shared/context/RefreshContext";
import {postItem, updateItem} from "@/components/listing/ItemsOnTable.js";
import {addToast} from "@/lib/toast";
import ResourceStatusChangeModal from "@/components/modals/ResourceStatusChangeModal";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";

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
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl overflow-y-auto p-4 sm:p-6">
                    <DialogHeader className="pr-6">
                        <DialogTitle>{action === "create" ? "Créer" : "Modifier"}</DialogTitle>
                    </DialogHeader>
                            <ItemForm
                                key={`${action}-${defaultValues?.id || "new"}`}
                                defaultValues={action==="edit" ? defaultValues : null}
                                onSubmit={handleFormSubmit}
                                onClose={() => onOpenChange(false)}
                                action={action}
                                fields={formFields}
                            />
                </DialogContent>
            </Dialog>

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
