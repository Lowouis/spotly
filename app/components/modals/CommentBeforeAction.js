import {useAdminDataManagerContext} from "@/app/context/AdminDataManager";
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
                                            variant="bordered"
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
                                <Button color={"warning"} variant="flat" onPress={() => {
                                    updateEntryModerate(item, "REJECTED");
                                    onClose();
                                    addToast({
                                        title: "Réservation refusée",
                                        description: "La réservation a été refusée avec succès",
                                        timeout: 5000,
                                        variant: "flat",
                                        radius: "sm",
                                        color: "warning"
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
                                            color: "success"
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
