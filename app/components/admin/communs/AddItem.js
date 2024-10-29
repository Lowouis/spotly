import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@nextui-org/react";
import SiteForm from "@/app/components/admin/form/site";

export default function ActionOnItem({isOpen, onOpenChange, action='créer', values}) {

    return (
        <>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} backdrop="blur" isKeyboardDismissDisabled={true}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">{action[0].toUpperCase()+action.slice(1)}</ModalHeader>
                            <ModalBody>
                              <SiteForm  values={values}/>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Annuler
                                </Button>
                                <Button color="primary" onPress={onClose}>
                                    {action==="créer" ? "Créer" : "Modifier" }
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}