import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {EyeIcon} from "@heroicons/react/24/solid";

export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }) + " " + new Date(date).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(':', 'h')
}
export default function ModalCheckingBooking({entry}){

    const {isOpen, onOpen, onOpenChange} = useDisclosure();

    return (
        <>
        <Button
            isIconOnly={true}
            className="block"
            size="lg"
            color="default"
            variant="ghost"
            onClick={onOpen}
        >
            <span className="flex justify-center items-center"><EyeIcon width="32" height="32" color='blue' /></span>
        </Button>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" size="sx">
            <ModalContent>
                {(onClose) => (
                    <>
                        {/*ajust for mobile later*/}
                        <ModalHeader className="flex flex-col gap-1">{entry?.resource?.name}</ModalHeader>
                        <ModalBody>
                            <p>
                                Début : {formatDate(entry?.startDate)}

                            </p>
                            <p>
                                Fin : {formatDate(entry?.endDate)}
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Fermer
                            </Button>
                            <Button color="primary" onPress={onClose}>
                                Modifier
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
        </>

    )
}