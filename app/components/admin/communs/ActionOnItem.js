import {
    Modal,
    ModalContent,
    ModalHeader,
} from "@nextui-org/react";
import {useMutation} from "@tanstack/react-query";
import ItemForm from "@/app/components/admin/form/ItemForm";
import React from "react";
import {useRefreshContext} from "@/app/context/RefreshContext";
import {postItem, updateItem} from "@/app/components/admin/communs/ItemsOnTable.js";

export default function ActionOnItem({isOpen, onOpenChange, action, defaultValues, formFields, model}) {
    const { refreshData } = useRefreshContext();
    const handleSuccess = (action) => {
        return () => {
            refreshData();
        };
    };



    const createMutation = useMutation({
        mutationFn: postItem,
        onSuccess: handleSuccess("créé"),
    });

    const updateMutation = useMutation({
        mutationFn: updateItem,
        onSuccess: handleSuccess("modifié"),
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
                            <ModalHeader className="flex flex-col gap-1">
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
