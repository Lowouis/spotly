import {
    Modal, ModalBody,
    ModalContent, ModalFooter,
    ModalHeader,
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {useMutation} from "@tanstack/react-query";
import ItemForm from "@/app/components/admin/form/ItemForm";

const postItem = async ({data, model}) => {
    console.log(JSON.stringify(data));
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/${model}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create item');
        }

        return response.json();
};


export default function ActionOnItem({isOpen, onOpenChange, action, defaultValues, formFields, model, setRefresh}) {
    const mutation = useMutation({
        mutationFn : postItem,
        onSuccess: () => {
            setRefresh(true);
        }

    });
    const handleFormSubmit = (data) => {
        mutation.mutate({data, model});
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
