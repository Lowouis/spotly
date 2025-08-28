import {Button} from "@heroui/button";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";


export default function PopupDoubleCheckAction({onConfirm, title, message, isOpen, onOpenChange}) {
    const handleConfirm = (onClose) => {
        onConfirm();
        onClose();
    }
    return (
        <>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
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
                    }
                }
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader
                                className="flex flex-col gap-1 text-neutral-900 dark:text-neutral-100">{title}</ModalHeader>
                            <ModalBody>
                                <p className="text-neutral-900 dark:text-neutral-100">
                                    {message}
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="default" variant="light" onPress={onClose}>
                                    Non
                                </Button>
                                <Button color="default" onPress={() => handleConfirm(onClose)}>
                                    Oui
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    )
}