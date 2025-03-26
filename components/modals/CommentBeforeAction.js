import {useAdminDataManagerContext} from "@/context/AdminDataManager";
import {Button} from "@nextui-org/button";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea} from "@nextui-org/react";
import {addToast} from "@heroui/toast";

export const CommentBeforeAction = ({action, item, isOpen, onOpenChange}) => {
    const {updateEntryModerate} = useAdminDataManagerContext()

    return (
        <>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="md"
                backdrop="opaque"
                closeOnEsc
                motionProps={{
                    variants: {
                        enter: {
                            y: 0,
                            opacity: 1,
                            transition: {
                                duration: 0.3,
                                ease: "easeOut",
                            },
                        },
                        exit: {
                            y: -20,
                            opacity: 0,
                            transition: {
                                duration: 0.2,
                                ease: "easeIn",
                            },
                        },
                    },
                }}


            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Modération de réservation</ModalHeader>
                            <ModalBody>
                                <form>
                                    <div className="form-group">
                                        <Textarea
                                            label={"Commentaire"}
                                            id="adminNote"
                                            name="adminNote"
                                            rows={9}
                                            type="text"
                                            variant="flat"
                                            className="form-input"
                                            placeholder="Fournir plus d'informations sur les raisons de votre decision"
                                            defaultValue={item.adminNote}
                                            onChange={(e) => {
                                                item.adminNote = e.target.value;
                                            }}
                                        />
                                    </div>
                                </form>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="default" variant="flat" onPress={() => {
                                    updateEntryModerate(item, "REJECTED");
                                    onClose();
                                    addToast({
                                        title: "Réservation refusée",
                                        description: "La réservation a été refusée avec succès",
                                        timeout: 5000,
                                        variant: "solid",
                                        radius: "sm",
                                        color: "default"
                                    });
                                }}>
                                    Refuser
                                </Button>
                                <Button
                                    color="default"
                                    variant="flat"
                                    onPress={() => {
                                        updateEntryModerate(item, "ACCEPTED");
                                        onClose();
                                        addToast({
                                            title: "Réservation acceptée",
                                            description: "La réservation a été acceptée avec succès",
                                            timeout: 5000,
                                            variant: "flat",
                                            radius: "sm",
                                            color: "default"
                                        });

                                    }}
                                >
                                    Accepter
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
