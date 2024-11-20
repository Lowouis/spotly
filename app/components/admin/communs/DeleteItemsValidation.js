import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/react";
import {Button} from "@nextui-org/button";


export default function DeleteItemsValidation({isDeleteConfirmOpen, onDeleteConfirmOpenChange}){

    console.log("isDeleteConfirmOpen",isDeleteConfirmOpen)
    return (
        <Modal isOpen={isDeleteConfirmOpen} onOpenChange={onDeleteConfirmOpenChange}>
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