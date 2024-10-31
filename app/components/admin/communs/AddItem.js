import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@nextui-org/react";
import SiteForm from "@/app/components/admin/form/site";
import {useEffect, useState} from "react";



export default function ActionOnItem({isOpen, onOpenChange, action='créer', values=null, fields}) {
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

    return (
        <>
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
        </>
    );
}