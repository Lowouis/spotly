import {Modal, ModalContent, ModalHeader,} from "@nextui-org/react";
import {useMutation} from "@tanstack/react-query";
import ItemForm from "@/components/form/ItemForm";
import React from "react";
import {useRefreshContext} from "@/context/RefreshContext";
import {postItem, updateItem} from "@/components/listing/ItemsOnTable.js";
import {addToast} from "@heroui/toast";

export default function ActionOnItem({isOpen, onOpenChange, action, defaultValues, formFields, model}) {
    const { refreshData } = useRefreshContext();
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
            console.log("Error:", error);
            if (error?.code === "MODERATED_RESOURCES_WITH_OWNER") {
                const resourcesList = error.resources
                    .map(resource => resource.name)
                    .join(', ');
                console.log("Resources list:", resourcesList);
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


    const handleFormSubmit = (data) => {
        if(action === "create") {
            createMutation.mutate({data, model});
        } else {
            updateMutation.mutate({
            data : {
                id: defaultValues.id,
                ...data
            },
                model
            });
        }
    };

    return (
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
        );

}
