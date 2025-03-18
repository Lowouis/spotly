import {
    InputOtp,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Tooltip,
    useDisclosure
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import Stepper from "@/components/utils/Stepper";
import React, {useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {ArrowRightIcon, ChevronRightIcon, HandRaisedIcon} from "@heroicons/react/24/outline";
import {getEmailTemplate} from "@/utils/mails/templates";
import {useEmail} from "@/context/EmailContext";
import {TrashIcon} from "@heroicons/react/24/solid";
import {addToast} from "@heroui/toast";


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
export default function ModalCheckingBooking({entry, adminMode=false, handleRefresh, setUserAlert}) {
    const [otp, setOtp] = useState("");
    const [error, setError] = useState(null);
    const [alertContent, setAlertContent ] = useState({title: "", description: "", status: ""});
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [modalStepper, setModalStepper] = useState("main");
    const { mutate: sendEmail } = useEmail();

    const handlePickUp = (onClose)=>{
        setError(null);
        setOtp("");
        if (whichPickable() === "DIGIT" || whichPickable() === "HIGH_AUTH" || whichPickable() === "LOW_AUTH") {
            setModalStepper("pickup")
        } else {
            handlePickUpUpdate({entry});
            onClose();
        }
        handleRefresh();
    }

    const handleReturn = ()=>{
        setError(null);
        setOtp("");

        if (whichPickable() === "DIGIT" || whichPickable() === "HIGH_AUTH" || whichPickable() === "LOW_AUTH") {
            setModalStepper("return")
        } else {
            handleReturnUpdate({entry});
        }
    }
    const whichPickable = () => {
        if(entry.resource.pickable !== null) {
            return entry.resource.pickable;
        } else if(entry.resource.category.pickable !== null) {
            return entry.resource.category.pickable;
        } else if (entry.resource.domains.pickable !== null) {
            return entry.resource.domains.pickable;
        }
        return "FLUENT";
    }

    const entryAction = ()=> {
        if (whichPickable(entry) === "LOW_TRUST" || whichPickable(entry) === "FLUENT") {
            return "NODIGIT";
        } else {
            return "DIGIT"
        }
    }

    //ADMIN SIDE
    //CONFIRM ANY ENTRIES ASKED FOR
    //SWITCH ENTRY STATUS TO ACCEPTED

    //USER SIDE
    //RETURN A RESOURCE ACCORDING TO USER ENTRY
    //UPDATE RETURNED ATTRIBUTES BOOLEAN TO ENTRIES WITH PUT METHOD

    const { mutate: updateEntry } = useMutation({
        mutationFn: async ({method, entry, updateData}) => {
            const response = await fetch(`/api/entry/${entry.id}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                ...(updateData && {body : JSON.stringify(updateData)}),
            });

            if (!response.ok) {
                throw new Error('Échec de la mise à jour');
            }

            return response.json();
        },
        onSuccess: () => {
            handleRefresh();
        },
        onError: () => {
            addToast({
                title: "Erreur",
                description : "La ressource n'as pas pu être modifié. Si le problème persiste contacter un administrateur.",
                timeout: 5000,
                shouldShowTimeoutProgess: true,
                variant : "solid",
                radius : "sm",
                classNames: {
                    closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
                },
                closeIcon: (
                    <svg
                        fill="none"
                        height="32"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="32"
                    >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                ),
                color : "danger"
            });
        }
    });

    const handlePickUpUpdate = () => {
        addToast({
            title: "Pick-up",
            description : "La récupèration de la ressource à bien été prise en compte.",
            timeout: 5000,
            shouldShowTimeoutProgess: true,
            variant : "solid",
            radius : "sm",
            classNames: {
                closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
            },
            closeIcon: (
                <svg
                    fill="none"
                    height="32"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="32"
                >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            ),
            color : "primary"
        });

        updateEntry({
            entry,
            updateData: { moderate: "USED" },
            method : "PUT"
        });
        setModalStepper("main")
        setOtp("");
        handleRefresh();
    }

    const handleReturnUpdate = () => {
        addToast({
            title: "Restitution",
            description : "La ressource à bien été retournée.",
            timeout: 5000,
            shouldShowTimeoutProgess: true,
            variant : "solid",
            radius : "sm",
            classNames: {
                closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
            },
            closeIcon: (
                <svg
                    fill="none"
                    height="32"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="32"
                >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            ),
            color : "success"
        });
        updateEntry({
            entry,
            updateData: { returned: true, moderate: "ENDED" },
            method : "PUT"
        });
        setModalStepper("main");
        sendEmail({
            "to": entry.user.email,
            "subject": "Confirmation de restitution - " + entry.resource.name,
            "text": getEmailTemplate("reservationReturnedConfirmation",
                {
                    resource: entry.resource,
                    endDate: new Date(entry.endDate),
                })
        });
        handleRefresh();
    }


    const handleDeleteEntry = () => {
        updateEntry({
            entry,
            method : "DELETE"
        });
        sendEmail({
            "to": entry.user.email,
            "subject": "Confirmation de l'annulation de votre réservation Spotly - " + entry.resource.name,
            "text": getEmailTemplate("reservationCancelled", {
                    user: entry.user.name + " " + entry.user.surname,
                    resource: entry.resource.name,
                    startDate: new Date(entry.startDate).toLocaleString("FR-fr", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric"
                    }),
                    endDate: new Date(entry.endDate).toLocaleString("FR-fr", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric"
                    }),
                })
        });
        setModalStepper("main")
        handleRefresh();
        addToast({
            title: "Annulation de réservation",
            description : "Votre réservation à bien été "+(adminMode ? "supprimer" : "annuler")+" avec succès.", status: "success",
            timeout: 5000,
            shouldShowTimeoutProgess: true,
            variant : "solid",
            radius : "sm",
            classNames: {
                closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
            },
            closeIcon: (
                <svg
                    fill="none"
                    height="32"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="32"
                >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            ),
            color : "success"
        });
    }

    const handleUpdateEntity = () => {
        if(otp === entry.returnedConfirmationCode){
            modalStepper === "return" ? handleReturnUpdate({ entry }) : handlePickUpUpdate({ entry });
        } else {
            setError("Le code ne correspond pas, veuillez réessayer");
        }
    };
    const handleOwnerReturn = (entry) => {
            if (entry.resource.owner !== null){
                return entry.resource.owner.name + " " + entry.resource.owner.surname;
            } else if(entry.resource.category.owner !== null) {
                return entry.resource.category.owner.name + " " + entry.resource.category.owner.surname;
            } else if(entry.resource.domains.owner !== null) {
                return entry.resource.domains.owner.name + " " + entry.resource.domains.owner.surname;
            } else {
                return null;
            }
    }
    return (
        <>
            {adminMode ?
                (
                    <div className="flex justify-center items-center">
                        <Tooltip content="Consulter" color="default"  size={'sm'} showArrow>
                            <Button
                                className="font-medium underline underline-offset-4"
                                size="sm"
                                variant="flat"
                                color="default"
                                isIconOnly
                                radius="sm"
                                onPress={onOpen}
                            >
                                <ChevronRightIcon
                                    className="font-bold"
                                    width="18"
                                    height="18"
                                />
                            </Button>
                        </Tooltip>
                    </div>
                ) : (
                    <Button
                        isIconOnly={true}
                        className=""
                        size="lg"
                        color="default"
                        variant={adminMode ? "ghost" : "flat"}
                        onPress={onOpen}
                    >
                <span className="flex justify-center items-center">
                    <ChevronRightIcon
                        className="transform transition-transform group-hover:translate-x-1 font-bold "
                        width="24"
                        height="24"
                    />
                </span>
            </Button>
                )}
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            backdrop="blur"
            size="2xl"
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
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">{entry?.resource?.name}</ModalHeader>
                        { modalStepper === "delete" && (
                            <ModalBody>
                                <div className="flex flex-col justify-center items-center">
                                    <h1 className="text-lg">Êtes-vous sûr de vouloir {adminMode ? "supprimer" : "annuler"} cette réservation ?</h1>
                                    <div className="flex flex-row m-1 space-x-4 justify-center w-full items-center">
                                        <Button size={"lg"} color="default"
                                                variant="flat"
                                                onPress={() => setModalStepper("main")}>Non</Button>
                                        <Button size={"lg"} variant="flat" color="danger" onPress={()=>{handleDeleteEntry();onClose();}}>Oui</Button>
                                    </div>
                                </div>
                            </ModalBody>
                        )}
                        { modalStepper === "return" && (
                            <ModalBody>
                                <div className="flex flex-col justify-center items-center">
                                    {error !== null && (
                                        <div>
                                            <span className="text-red-500">{error}</span>
                                        </div>
                                    )}
                                    <InputOtp
                                        onValueChange={setOtp}
                                        value={otp}
                                        variant="flat"
                                        size="lg"
                                        length={6}
                                        name="confirmation_code"
                                    />
                                    <label className="text-slate-600">Nous vous avons envoyé un code à <span className="font-semibold">{entry?.user.email}</span></label>
                                </div>
                                <Button size={"lg"} color="primary" variant="flat" onPress={handleUpdateEntity}>Confirmer</Button>
                            </ModalBody>
                        )}
                        { modalStepper === "pickup" && (
                            <ModalBody>
                                <div className="flex flex-col justify-center items-center">
                                    {error !== null && (
                                        <div>
                                            <span className="text-red-500">{error}</span>
                                        </div>
                                    )}
                                    <InputOtp
                                        onValueChange={setOtp}
                                        value={otp}
                                        variant="flat"
                                        size="lg"
                                        length={6}
                                        name="confirmation_code"
                                    />
                                    <label className="text-slate-600">Nous vous avons envoyé un code à <span className="font-semibold">{entry?.user.email}</span></label>
                                </div>
                                <Button size={"lg"} color="primary" variant="flat" onPress={handleUpdateEntity}>Confirmer</Button>
                            </ModalBody>
                        )}

                        { modalStepper === "main" && (
                            <ModalBody>
                                <div className="flex flex-col justify-center items-start">
                                    <Stepper
                                        step={1}
                                        done={true}
                                        content={
                                            <div className="w-full flex flex-col">
                                                <h1 className={"text-blue-900 dark:text-blue-300 text-lg"}>Création de
                                                    la réservation</h1>
                                                <span>Confirmation par mail à <span
                                                    className="font-semibold">{entry?.user.email}</span></span>
                                                <span>{formatDate(entry?.createdAt)}</span>
                                            </div>
                                        }
                                    />
                                    <Stepper
                                        step={2}
                                        content={
                                            <div className="w-full">
                                                <h1 className={"text-blue-900 dark:text-blue-300  text-lg"}>
                                                    Confirmation
                                                </h1>
                                                <span>
                                                    { entry.moderate !== "WAITING" && entry.moderate !== "REJECTED" ? "Accepté le " + formatDate(entry.lastUpdatedModerateStatus) : "" }
                                                </span>
                                                <span>
                                                    {entry.moderate === "WAITING" && "En attente de confirmation"}
                                                    {entry.moderate === "REJECTED" && "Refuser"}
                                                    {handleOwnerReturn(entry) && ` par ${handleOwnerReturn(entry)}`}
                                                </span>
                                            </div>
                                        }
                                        done={entry.moderate !== "WAITING" &&  entry.moderate !== "REJECTED"}
                                        failed={entry.moderate === "REJECTED"}
                                        adminMode={adminMode}
                                        entry={entry}
                                    />
                                    <Stepper
                                        step={3}
                                        content={
                                            <div className="w-full">
                                                <h1 className={"text-blue-900 dark:text-blue-300  text-lg"}>
                                                    <span>{entry.moderate === "USED" ? "En cours d'utilisation" : "Réservation"}</span>
                                                </h1>
                                                <span>à partir du {formatDate(entry.startDate)}</span>
                                                {
                                                    whichPickable() !== "FLUENT" && entry.moderate === "ACCEPTED" && entry.startDate <= new Date().toISOString() &&  entry?.endDate > new Date().toISOString() && (
                                                        <Button
                                                            className="text-blue-500 font-bold ml-6"
                                                            size="lg" variant="flat" onPress={()=>handlePickUp(onClose)}
                                                        >
                                                            Prendre
                                                            <HandRaisedIcon width={24} height={24} className="font-bold transform transition-transform group-hover:translate-x-2"/>
                                                        </Button>
                                                    )
                                                }
                                            </div>
                                        }
                                        done={entry?.startDate <= new Date().toISOString() && entry.moderate === "ENDED" || entry.moderate === "DELAYED" || entry.moderate === "REJECTED" || entry.moderate === "USED"}
                                        failed={entry?.endDate <= new Date().toISOString() && (entry.moderate === "ACCEPTED" || entry.moderate === "WAITING") || entry.moderate === "REJECTED"}
                                        adminMode={adminMode}

                                    />
                                    <Stepper
                                        step={4}
                                        content={
                                            <div className="flex flex-row">
                                                <div className="w-full flex flex-col">
                                                    <h1 className={"text-blue-900 dark:text-blue-300 text-lg"}>
                                                        {entry.returned ? "Restitué" : "Restitution"}
                                                    </h1>
                                                    <span>le {entry.returned ? formatDate(entry?.updatedAt) : formatDate(entry?.endDate)}</span>
                                                </div>
                                                <div className="ml-10 flex justify-center items-center ">
                                                    {entry.moderate === "USED" &&
                                                        <Button
                                                            className="font-bold text-orange-700  underline-offset-4 ml-2"
                                                            size="lg"
                                                            variant="light"
                                                            onPress={handleReturn}
                                                        >
                                                            Retourner
                                                            <ArrowRightIcon
                                                                width={24}
                                                                height={24}
                                                                className="font-bold transform transition-transform group-hover:translate-x-2"
                                                            />
                                                        </Button>
                                                    }
                                                </div>
                                            </div>

                                        }
                                        adminMode={adminMode}
                                        done={entry.moderate === "ENDED" && entry.returned}
                                        failed={entry?.returned === false && entry.endDate <= new Date().toISOString() && entry.moderate === "USED" || entry.moderate === "REJECTED"}
                                        last={true}
                                    />
                                </div>
                                <div>
                                    {entry.comment && (
                                        <div className="flex flex-col w-full">
                                            <h1 className="text-lg">{!adminMode ? "Votre note : " : "De " + entry.user.surname + " " + entry.user.name +" : "}</h1>
                                            <span className="text-slate-600">{entry.comment}</span>
                                        </div>
                                    )}
                                        {entry.adminNote && (
                                        <div className="flex flex-col w-full justify-end items-end">
                                            <h1 className="text-lg">Manager</h1>
                                            <span className="text-slate-600">{entry.adminNote}</span>
                                        </div>
                                    )}

                                </div>
                            </ModalBody>
                        )}
                        <ModalFooter>
                        { modalStepper === "main" && (entry.moderate === "ACCEPTED" || entry.moderate === "WAITING") && (
                                <Button
                                    size={"lg"}
                                    color="danger"
                                    variant="light"
                                    onPress={()=>{setModalStepper("delete")}}
                                >
                                    <TrashIcon width={24} height={24} className=""/>
                                </Button>
                        )}
                        {modalStepper !== "main" && (<Button size={"lg"} color="primary" variant="flat" onPress={()=>setModalStepper("main")}>Retour</Button>)}
                        {entry.moderate !== "ENDED" || entry.moderate === "ACCEPTED" && <Button size={"lg"} color="success" onPress={onClose}>Modifier</Button>}

                        <Button size={"lg"} color="danger" variant="flat" onPress={()=>{onClose(); setModalStepper("main")}}>
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