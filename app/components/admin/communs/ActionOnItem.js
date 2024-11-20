import {
    Modal, ModalBody,
    ModalContent, ModalFooter,
    ModalHeader,
} from "@nextui-org/react";
import SiteForm from "@/app/components/admin/form/site";
import {useEffect, useState} from "react";
import {Button} from "@nextui-org/button";



export default function ActionOnItem({isOpen, onOpenChange, action='create', values=null, fields}) {
    const [push, setPush] = useState(false);
    const [newItemData, setNewItemData] = useState();

    const handleFormSubmit = (data) => {
        console.log(data);
        setNewItemData(data);
        setPush(true);
    }

    useEffect(() => {
        function createNewItem() {
            if (push && newItemData) {
                fetch(`http://localhost:3000/api/domains`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newItemData),
                })
                    .then(response => response.text())
                    .then(text => {
                        try {
                            const data = JSON.parse(text);
                            setPush(false);
                        } catch (error) {
                            console.error('Failed to parse JSON:', error);
                            console.error('Response text:', text);
                        }
                    })
                    .catch(error => {
                            console.error('Fetch error:', error);
                        }
                    );
            }
        }
        createNewItem();
    }, [push, newItemData, setNewItemData, setPush]);


    switch(action){
        case "create" : return (
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} backdrop="blur" isKeyboardDismissDisabled={true}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">{action[0].toUpperCase()+action.slice(1)}</ModalHeader>
                            <SiteForm defaultValues={values} onSubmit={handleFormSubmit} onClose={onClose} action={action} fields={fields}/>
                        </>
                    )}
                </ModalContent>
            </Modal>
        );
        case "delete" : return (<DeleteConfirmModal isOpen={isOpen} onChange={onOpenChange} />)
        default : return (<>ERROR 500</>)
    }
}


export const DeleteConfirmModal = (isOpen, OnChange)=>{
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