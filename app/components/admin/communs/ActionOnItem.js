import {
    Modal, ModalBody,
    ModalContent, ModalFooter,
    ModalHeader,
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {useMutation} from "@tanstack/react-query";
import ItemForm from "@/app/components/admin/form/ItemForm";

const postItem = async ({data, model}) => {
    console.log("MUTATE", JSON.stringify(data))
    const response = await fetch(`http://localhost:3000/api/${model}`, {
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


export default function ActionOnItem({isOpen, onOpenChange, action='create', values=null, formFields, model, setRefresh}) {
    const mutation = useMutation({
        mutationFn : postItem,
        onSuccess: () => {
            setRefresh(true);
        }

    });
    const handleFormSubmit = (data) => {
        console.log("KEYDATA", data);
        mutation.mutate({data, model});
    };

    switch(action){
        case "create" : return (
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} backdrop="blur" isKeyboardDismissDisabled={true}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Créer</ModalHeader>
                            <ItemForm defaultValues={values} onSubmit={handleFormSubmit} onClose={onClose} action={action} fields={formFields}/>
                        </>
                    )}
                </ModalContent>
            </Modal>
        );
        case "delete" : return (<DeleteConfirmModal isOpen={isOpen} onChange={onOpenChange} />)
        default : return (<>ERROR 500</>)
    }
}

export const DeleteConfirmModal = (isOpen, OnChange) => {
    return (
        <Modal isOpen={isOpen} onOpenChange={OnChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
                        <ModalBody>
                            <p>
                                ARE U SURE ??? TO DELETE X ITEM(S)
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Close
                            </Button>
                            <Button color="primary" onPress={onClose}>
                                Action
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}