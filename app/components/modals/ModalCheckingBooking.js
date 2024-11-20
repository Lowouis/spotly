import {Divider, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {EyeIcon} from "@heroicons/react/24/solid";
import Stepper from "@/app/components/utils/Stepper";

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
    const isDateLaterThanToday = (date)=>{

        return date
    }
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
                        <ModalBody>
                            <div className="flex flex-col justify-center items-start">
                                <Stepper
                                    step={1}
                                    done={true}
                                    content={
                                    <div className="w-full">
                                        <h1 className={"text-blue-900 text-lg"}>Confirmation par mail à <span className="font-semibold">{entry?.user.email}</span> </h1>
                                        <span>{formatDate(entry?.createdAt)}</span>
                                    </div>
                                    }
                                />
                                {/*<Stepper
                                    step={2}
                                    content={
                                             <div className="w-full">
                                                 <h1 className={"text-blue-900 text-lg"}>Approuvé par <span
                                                     className="font-semibold">{entry?.user.name}</span></h1>
                                                 <span>{formatDate(entry?.createdAt)}</span>
                                             </div>
                                    }
                                />*/}
                                <Stepper
                                    step={2}
                                    content={
                                        <div className="w-full">
                                            <h1 className={"text-blue-900 text-lg"}>
                                                Réservation
                                            </h1>
                                            <span>{formatDate(entry?.startDate)}</span>
                                        </div>
                                    }
                                    done={entry?.startDate > Date.now()}
                                />
                                <Stepper
                                    content={
                                        <div className="w-full">
                                            <h1 className={"text-blue-900 text-lg"}>
                                                Restitution
                                            </h1>
                                            <span>{formatDate(entry?.endDate)}</span>
                                        </div>
                                    }
                                    step={3}
                                    done={entry?.endDate > Date.now()}
                                    last={true}/>

                            </div>
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