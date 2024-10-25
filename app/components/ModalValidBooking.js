import {Button} from "@nextui-org/button";
import {Checkbox, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Switch, Textarea} from "@nextui-org/react";
import {formatDate} from "@/app/components/ModalCheckingBooking";
import {ExclamationTriangleIcon} from "@heroicons/react/24/outline";
import {useState} from "react";


export default function ModalValidBooking({data, isOpen, onOpenChange}) {
    const [comment, setComment] = useState(false);
    const  handleCommentSwitch = () => {
        console.log("Switched");
        //add comment form
        setComment(!comment);
    }
    console.log(data)
    return (<>
        <Modal
            shadow="md"
            isDismissable={false}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="center"
            backdrop="blur"

        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Réservation</ModalHeader>
                        <ModalBody>

                            <div className="flex flex-col space-y-2 text-lg">
                                <div>
                                    Début : {formatDate(data.date.start)}
                                </div>
                                <div>
                                    Fin : {formatDate(data.date.end)}
                                </div>
                                <Switch
                                    size="md"
                                    name="comment"
                                    id="comment"
                                    color="primary"
                                    className="mb-2"
                                    onClick={handleCommentSwitch} // Pas besoin de passer `e` dans onClick
                                >
                                    Ajouter un commentaire
                                </Switch>
                                <Textarea
                                    isDisabled={!comment}
                                    id="description"
                                    isHidden={!comment}
                                    labelPlacement="outside"
                                    placeholder="Écrire un commentaire"
                                />
                                <Switch
                                    size="md"
                                    name="key"
                                    id="key"
                                    color="primary"
                                    className="mb-2"
                                >
                                    Clé empruntée
                                </Switch>
                                <div className="flex flex-row items-center space-x-2">
                                    <ExclamationTriangleIcon width="24" height="24" color="red"/>
                                </div>
                                <div>
                                    <span className="flex flex-col space-y-2 text-slate-700 mt-6">
                                        <span className="font-bold text-lg">Conditions d'utilisation</span>
                                        <span className="text-slate-500 text-sm">
                                            La ressource doit être restituée dans le délai indiqué. Pour confirmer le retour, un code à 6 chiffres vous sera envoyé par mail pour confirmer le retour de la ressource.
                                        </span>
                                        <Checkbox id="cgu" name="cgu" required defaultSelected radius="md">J'accepte les conditions</Checkbox>

                                    </span>
                                </div>

                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="flat" size="lg" onPress={onClose}>
                            Annuler
                            </Button>
                            <Button color="primary" onPress={onClose} size="lg">
                                Réserver
                            </Button>
                        </ModalFooter>
                    </>
                )}

            </ModalContent>
        </Modal>
    </>)
}