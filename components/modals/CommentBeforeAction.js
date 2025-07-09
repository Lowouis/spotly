import {useAdminDataManagerContext} from "@/context/AdminDataManager";
import {Button} from "@nextui-org/button";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Textarea} from "@nextui-org/react";
import {addToast} from "@heroui/toast";
import {useEmail} from "@/context/EmailContext";
import {getEmailTemplate} from "@/utils/mails/templates";

export const CommentBeforeAction = ({action, item, isOpen, onOpenChange}) => {
    const {updateEntryModerate} = useAdminDataManagerContext()
    const {mutate: sendEmail} = useEmail();
    
    return (
        <>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="md"
                backdrop="blur"
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
                classNames={{
                    base: "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800",
                    header: "border-b border-neutral-200 dark:border-neutral-800",
                    footer: "border-t border-neutral-200 dark:border-neutral-800",
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none"
                                         stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>
                                    </svg>
                                    <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Modération
                                        de réservation</h3>
                                </div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Veuillez fournir un
                                    commentaire pour justifier votre décision</p>
                            </ModalHeader>
                            <ModalBody>
                                <form className="space-y-4">
                                    <div className="form-group">
                                        <Textarea
                                            label="Commentaire de modération"
                                            id="adminNote"
                                            name="adminNote"
                                            rows={6}
                                            type="text"
                                            variant="bordered"
                                            className="form-input"
                                            placeholder="Expliquez les raisons de votre décision..."
                                            defaultValue={item.adminNote}
                                            onChange={(e) => {
                                                item.adminNote = e.target.value;
                                            }}
                                            classNames={{
                                                label: "text-neutral-700 dark:text-neutral-300",
                                                input: "text-neutral-700 dark:text-neutral-300",
                                                inputWrapper: "bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800/70",
                                            }}
                                        />
                                    </div>
                                </form>
                            </ModalBody>
                            <ModalFooter className="flex justify-between gap-2">
                                <Button
                                    color="danger"
                                    variant="flat"
                                    onPress={() => {
                                        updateEntryModerate(item, "REJECTED");
                                        onClose();
                                        addToast({
                                            title: "Réservation refusée",
                                            description: "La réservation a été refusée avec succès.",
                                            timeout: 5000,
                                            color: "danger"
                                        });
                                        sendEmail({
                                            to: item.user.email,
                                            subject: "Votre réservation a été refusée",
                                            templateName: "rejected",
                                            data: item,
                                        });
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                    Refuser
                                </Button>
                                <Button
                                    color="success"
                                    variant="flat"
                                    onPress={() => {
                                        updateEntryModerate(item, "ACCEPTED");
                                        onClose();
                                        addToast({
                                            title: "Réservation acceptée",
                                            description: "La réservation a été acceptée avec succès.",
                                            timeout: 5000,
                                            color: "success"
                                        });
                                        sendEmail({
                                            to: item.user.email,
                                            subject: "Votre réservation a été acceptée",
                                            templateName: "reservationConfirmation",
                                            data: item,
                                        });
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M5 13l4 4L19 7"/>
                                    </svg>
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
