import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {EyeIcon} from "@heroicons/react/24/solid";
import Stepper from "@/app/components/utils/Stepper";
import {useState} from "react";
import {Input} from "@nextui-org/input";
import {useMutation} from "@tanstack/react-query";

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
export default function ModalCheckingBooking({entry, adminMode=false, handleRefresh}) {

    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [activeReturnStep, setActiveReturnStep] = useState(false);
    const handleReturnStep = ()=>{
        setActiveReturnStep(!activeReturnStep)
    }
    const { mutate } = useMutation({
        mutationFn: async ({ entry }) => {
            const response = await fetch(`http://localhost:3000/api/entry/${entry.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Failed to delete entry');
            }
            return response.json();
        },
        onSuccess: () => {
            handleRefresh();
            console.debug("Entry deleted");
        },
        onError: (error) => {
            console.error(error);
            console.debug("Entry NOT deleted");
        },
    });

    const handleDeleteEntry = () => {
        mutate({ entry });
    };

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
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" size="2xl">
            <ModalContent>
                {(onClose) => (
                    <>
                        {/*ajust for mobile later*/}
                        <ModalHeader className="flex flex-col gap-1">{entry?.resource?.name}</ModalHeader>
                        {activeReturnStep ? (
                            <ModalBody>
                                <div className="flex flex-col space-y-2">
                                    <div>
                                        <label>Entrer le code de confirmation</label>
                                    </div>
                                    <div className="flex flex-row justify-center items-center space-x-2">
                                        <Input name="return_code" size="lg" key={entry?.id} placeholder="XXX-XXX"/>
                                        <Button size="lg" color="primary"
                                                onPress={e=>console.log("submit code to return")}>Valider</Button>

                                    </div>
                                </div>

                            </ModalBody>
                        ) : (
                            <ModalBody>
                                <div className="flex flex-col justify-center items-start">
                                    <Stepper
                                        step={1}
                                        done={true}
                                        content={
                                            <div className="w-full flex flex-col">
                                                <h1 className={"text-blue-900 text-lg"}>Création de la réservation</h1>
                                                <span>Confirmation par mail à <span
                                                    className="font-semibold">{entry?.user.email}</span></span>
                                                {/*issues bc we delete this attribute to simulate an PDO*/}
                                                <span>{formatDate(entry?.createdAt)}</span>
                                            </div>

                                        }
                                    />

                                    <Stepper
                                        step={2}
                                        content={
                                            <div className="w-full">
                                                <h1 className={"text-blue-900 text-lg"}>
                                                    Confirmation
                                                </h1>
                                                <span>{entry.moderate === "ACCEPTED" ? "Accepté le "+formatDate(entry.lastUpdatedModerateStatus) : "En attente"}</span>

                                            </div>
                                        }
                                        done={entry.moderate === "ACCEPTED"}
                                        adminMode={adminMode}
                                        entry={entry}
                                    />
                                    <Stepper
                                        step={3}
                                        content={
                                            <div className="w-full">
                                                <h1 className={"text-blue-900 text-lg"}>
                                                    Réservation
                                                </h1>
                                                <span>{formatDate(entry?.startDate)}</span>
                                            </div>
                                        }
                                        done={new Date(entry?.endDate) <= Date.now() && entry.moderate === "ACCEPTED"}
                                        adminMode={adminMode}

                                    />
                                    <Stepper
                                        step={4}
                                        content={
                                            <div className="w-full">
                                                <h1 className={"text-blue-900 text-lg"}>
                                                    Restitution
                                                </h1>
                                                <span>{formatDate(entry?.endDate)}</span>
                                            </div>
                                        }
                                        adminMode={adminMode}
                                        done={new Date(entry?.endDate) < Date.now() && entry.moderate === "ACCEPTED"}
                                        last={true}
                                        handleReturnStep={handleReturnStep}

                                    />

                                </div>
                            </ModalBody>
                        )}
                        <ModalFooter>
                        {!activeReturnStep ? (
                            <Button size={"lg"} color="primary" onPress={onClose}>
                                Modifier
                            </Button>
                        ) : (
                            <Button size={"lg"} color="primary" onPress={handleReturnStep}>Retour</Button>
                        )}
                            <Button size={"lg"} color="danger" variant="solid" onPress={e=>{onClose(); handleDeleteEntry()}}>
                                Annuler
                            </Button>
                            <Button size={"lg"} color="danger" variant="light" onPress={e=>{onClose(); setActiveReturnStep(false)}}>
                                Fermer
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
        </>

    )
}