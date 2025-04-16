import {
    InputOtp,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Spinner,
    Tooltip,
    useDisclosure
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import Stepper from "@/components/utils/Stepper";
import React, {useState} from "react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {ArrowRightIcon, ChevronRightIcon, HandRaisedIcon} from "@heroicons/react/24/outline";
import {getEmailTemplate} from "@/utils/mails/templates";
import {useEmail} from "@/context/EmailContext";
import {addToast} from "@heroui/toast";
import EntryComments from "@/components/comments/EntryComments";


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
export default function ModalCheckingBooking({entry, adminMode = false, handleRefresh}) {
    const [otp, setOtp] = useState("");
    const [error, setError] = useState(null);
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [modalStepper, setModalStepper] = useState("main");

    const { mutate: sendEmail } = useEmail();

    const {data: timeScheduleOptions, isLoading: isLoadingtimeScheduleOptions} = useQuery({
        queryKey: ['timeScheduleOptions'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/timeScheduleOptions`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des options de planification');
            }
            const data = await response.json();
            return {
                onPickup: data.onPickup,
                onReturn: data.onReturn,
                ajustedStartDate: new Date(new Date(entry.startDate).getTime() - (data.onPickup || 0) * 60000).toISOString(),
                ajustedEndDate: new Date(new Date(entry.endDate).getTime() + (data.onReturn || 0) * 60000).toISOString(),
            };
        },
    });


        
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
        console.log(entry);
        if (entry.resource.pickable !== undefined && entry.resource.pickable !== null) {
            return entry.resource.pickable.name;
        } else if (entry.resource.category.pickable !== undefined && entry.resource.category.pickable !== null) {
            return entry.resource.category.pickable.name;
        }
        return entry.resource.domains.pickable.name;
    }

    const validDatesToPickup = () => {
        if (isLoadingtimeScheduleOptions || !timeScheduleOptions) {
            return false;
        }
        return timeScheduleOptions.ajustedStartDate <= new Date().toISOString();
    }

    const entryAction = ()=> {
        if (whichPickable(entry) === "LOW_TRUST" || whichPickable(entry) === "FLUENT") {
            return "NODIGIT";
        } else {
            return "DIGIT"
        }
    }


    const { mutate: updateEntry } = useMutation({
        mutationFn: async ({method, entry, updateData}) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${entry.id}`, {
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
                    <div className="flex justify-center items-center ">
                        <Tooltip content="Consulter" color="foreground" size={'sm'} showArrow>
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
                    <Tooltip content={"Consulter"} color="foreground" showArrow>
                        <Button
                            isIconOnly={true}
                            size="lg"
                            color="default"
                            variant={adminMode ? "ghost" : "flat"}
                            onPress={onOpen}
                        >
                            <span className="flex justify-center items-center">
                                <ChevronRightIcon
                                    className="font-bold"
                                    width="24"
                                    height="24"
                                />
                            </span>
                        </Button>
                    </Tooltip>

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
                        {isLoadingtimeScheduleOptions ? (
                            <ModalBody>
                                <div className="flex justify-center items-center p-4">
                                    <Spinner size="lg"/>
                                </div>
                            </ModalBody>
                        ) : (
                            <>
                                <ModalHeader
                                    className="flex flex-col gap-1 text-neutral-900 dark:text-neutral-200">{entry?.resource?.name}
                                </ModalHeader>
                                {modalStepper === "delete" && (
                                    <ModalBody>
                                        <div className="flex flex-col justify-center">
                                            <h1 className="text-lg">Êtes-vous sûr de
                                                vouloir {adminMode ? "supprimer" : "annuler"} cette réservation ?</h1>
                                            <div
                                                className="flex flex-row m-1 space-x-4 justify-center w-full items-center">
                                                <Button size={"lg"} color="default"
                                                        variant="flat"
                                                        onPress={() => setModalStepper("main")}>Non</Button>
                                                <Button size={"lg"} variant="flat" color="danger" onPress={() => {
                                                    handleDeleteEntry();
                                                    onClose();
                                                }}>Oui</Button>
                                            </div>
                                        </div>
                                    </ModalBody>
                                )}

                                {(modalStepper === "pickup" || modalStepper === "return") && (
                                    <ModalBody>
                                        <div className="flex flex-col justify-center items-center space-y-6 py-4">
                                            {error !== null && (
                                                <div
                                                    className="bg-red-100 dark:bg-red-900/20 p-3 rounded-lg w-full text-center">
                                                    <span className="text-red-500 dark:text-red-400">{error}</span>
                                                </div>
                                            )}
                                            <div className="flex flex-col items-center space-y-4 w-full">
                                                <label className="text-neutral-700 dark:text-neutral-300 text-sm">
                                                    Saisissez le code à 6 chiffres envoyé à
                                                    <span
                                                        className="font-semibold ml-1 text-neutral-900 dark:text-neutral-100">
                                                        {entry?.user.email}
                                                    </span>
                                                </label>
                                                <div className="flex items-center space-x-4">
                                                    <InputOtp
                                                        onValueChange={setOtp}
                                                        value={otp}
                                                        variant="bordered"
                                                        size="lg"
                                                        length={6}
                                                        name="confirmation_code"
                                                        classNames={{
                                                            input: "text-2xl",
                                                            base: "gap-3"
                                                        }}
                                                    />
                                                    <Button
                                                        isIconOnly
                                                        size="lg"
                                                        color="primary"
                                                        variant="flat"
                                                        onPress={handleUpdateEntity}
                                                        isDisabled={otp.length !== 6}
                                                    >
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                                             stroke="currentColor" strokeWidth="2">
                                                            <path d="M20 6L9 17L4 12"/>
                                                        </svg>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </ModalBody>
                                )}

                                {modalStepper === "main" && (
                                    <ModalBody>
                                        <div className="flex flex-col justify-center items-start">
                                            <Stepper
                                                step={1}
                                                done={true}
                                                content={
                                                    <div className="w-full flex flex-col">
                                                        <h1 className={"text-blue-900 dark:text-blue-300 text-lg"}>Création
                                                            de la réservation</h1>
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
                                                            {entry.moderate !== "WAITING" && entry.moderate !== "REJECTED" ? "Accepté le " + formatDate(entry.lastUpdatedModerateStatus) : ""}
                                                        </span>
                                                        <span>
                                                            {entry.moderate === "WAITING" && "En attente de confirmation"}
                                                            {entry.moderate === "REJECTED" && "Refuser"}
                                                            {handleOwnerReturn(entry) && ` par ${handleOwnerReturn(entry)}`}
                                                        </span>
                                                    </div>
                                                }
                                                done={entry.moderate !== "WAITING" && entry.moderate !== "REJECTED"}
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
                                                            whichPickable() !== "FLUENT" &&
                                                            entry.moderate === "ACCEPTED" &&
                                                            !adminMode && entry?.endDate >= new Date().toISOString() &&
                                                        
                                                            validDatesToPickup() && (
                                                                <Button
                                                                    className="text-blue-500 font-bold ml-6"
                                                                    size="lg"
                                                                    variant="flat"
                                                                    onPress={() => handlePickUp(onClose)}
                                                                >
                                                                    Prendre
                                                                    <HandRaisedIcon width={24} height={24}
                                                                                    className="font-bold transform transition-transform group-hover:translate-x-2"/>
                                                                </Button>
                                                            )
                                                        }
                                                    </div>
                                                }
                                                done={entry?.startDate <= new Date().toISOString() && entry.moderate === "ENDED" || entry.moderate === "DELAYED" || entry.moderate === "REJECTED" || entry.moderate === "USED"}
                                                failed={timeScheduleOptions?.ajustedEndDate <= new Date().toISOString() && (entry.moderate === "ACCEPTED" || entry.moderate === "WAITING") || entry.moderate === "REJECTED"}
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
                                                            {entry.moderate === "USED" && whichPickable() !== "FLUENT" && !adminMode &&
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

                                        <EntryComments entry={entry} adminMode={adminMode}/>
                                    </ModalBody>
                                )}
                                <ModalFooter className='flex flex-row justify-between'>

                                    {!adminMode && modalStepper === "main" && (entry.moderate === "ACCEPTED" || entry.moderate === "WAITING") && (
                                        <Tooltip color="warning" content="Annuler définitivement la réservation."
                                                 showArrow placement="top-end">
                                            <Button
                                                size={"lg"}
                                                color="warning"
                                                variant="light"
                                                onPress={() => {
                                                    setModalStepper("delete")
                                                }}
                                            >
                                                Annuler

                                            </Button>
                                        </Tooltip>
                                    )}
                                    {modalStepper !== "main" && (<Button size={"lg"} color="default" variant="flat"
                                                                         onPress={() => setModalStepper("main")}>Retour</Button>)}
                                    {entry.moderate !== "ENDED" || entry.moderate === "ACCEPTED" &&
                                        <Button size={"lg"} color="default" onPress={onClose}>Modifier</Button>}
                                    <Button size={"lg"} color="default" variant="flat" onPress={() => {
                                        onClose();
                                        setModalStepper("main")
                                    }}>
                                        Fermer
                                    </Button>

                                </ModalFooter>
                            </>
                        )}
                    </>
                )}
            </ModalContent>
        </Modal>
        </>

    )
}