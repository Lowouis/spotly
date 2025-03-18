'use client';
import {Button} from "@nextui-org/button";
import {
    Checkbox, Divider,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Skeleton, Spinner,
    Textarea
} from "@nextui-org/react";
import {formatDate} from "@/components/modals/ModalCheckingBooking";
import {ArrowRightCircleIcon, ShieldExclamationIcon} from "@heroicons/react/24/solid";
import React, { useState} from "react";
import {constructDate, whoIsOwner, whoIsPickable} from "@/global";
import {useMutation} from "@tanstack/react-query";
import {useEmail} from "@/context/EmailContext";
import {getEmailTemplate} from "@/utils/mails/templates";
import {addToast} from "@heroui/toast";
export default function ModalValidBooking({EntryData, isOpen, onOpenChange, session, handleRefresh, setToast, handleResetFetchedResources}) {

    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        comment: "",
        cgu: false,
    });
    const { mutate: sendEmail } = useEmail();


    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === "checkbox" ? checked : value
        }));
    };
    const mutation = useMutation({
        mutationFn: async (newEntry) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newEntry),
            });
            if (!response.ok) {
                throw new Error('Failed to create entry');
            }
            return response.json();
        },
        onSuccess: (data) => {
            handleRefresh();
            handleResetFetchedResources();
            if(data.moderate === "WAITING") {
                const owner = whoIsOwner(data);
                sendEmail({
                    "to": session.user.email,
                    "subject": "Demande de réservation Spotly - " + EntryData.resource.name,
                    "text": getEmailTemplate("reservationRequestUser",
                        {
                            name: session.user.surname,
                            resource: EntryData.resource.name,
                            domain: EntryData.resource.domains.name,
                            startDate: new Date(data.startDate).toLocaleString("FR-fr", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric"
                            }),
                            endDate: new Date(data.endDate).toLocaleString("FR-fr", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric"
                            }),
                            owner: owner.name + " " + owner.surname,
                        })
                });
                sendEmail({
                    "to": owner.email,
                    "subject": "Nouvelle demande de réservation Spotly - " + EntryData.resource.name,
                    "text": getEmailTemplate("reservationRequestOwner",
                        {
                            user: data.user.surname,
                            resource: EntryData.resource.name,
                            owner : owner.name + " " + owner.surname,
                            domain: EntryData.resource.domains.name,
                            startDate: new Date(data.startDate).toLocaleString("FR-fr", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric"
                            }),
                            endDate: new Date(data.endDate).toLocaleString("FR-fr", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric"
                            }),
                        })
                });
            } else {
                    sendEmail({
                        "to" : data.user.email,
                        "subject" : "Nouvelle réservation Spotly - " + data.resource.name,
                        "text" : getEmailTemplate("reservationConfirmation",
                            {
                                name: data.user.name + " " + data.user.surname,
                                resource: data.resource.name,
                                domain: data.resource.domains.name,
                                startDate : new Date(data.startDate).toLocaleString("FR-fr", {weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric"}),
                                endDate : new Date(data.endDate).toLocaleString("FR-fr", {weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric"}),
                                key : data.returnedConfirmationCode,
                            })
                    });
            }
            addToast({
                title: "Nouvelle réservation",
                description : `Votre ${data.moderate === "WAITING" ? "demande" : "réservation"} est bien enregistrer, un mail de confirmation à été envoyé à ${session.user.email}`,
                color : "success"
            });
        },
        onError: (error) => {
            addToast({
                title: "Erreur : Nouvelle réservation",
                description : "La réservation n'a pas pu être effectuée. Si le problème pérsite merci de contacter un administrateur.",
                color : "danger"
            });

        },
    });

    const handleSubmission = (onClose) => {
        if (formData.cgu) {
            const startDate = constructDate(EntryData.date.start);
            const endDate = constructDate(EntryData.date.end);
            mutation.mutate({
                startDate: startDate,
                endDate: endDate,
                category: EntryData.category,
                site: EntryData.site,
                resourceId: EntryData.resource.id,
                userId: session.user.id,
                comment: formData.comment,
                moderate: EntryData.resource.moderate ? "WAITING" : whoIsPickable(EntryData) ? "USED" : "ACCEPTED",
            });
            setSubmitted(true);
            onClose();
        }
    };



    return (
        <>
        <Modal
            shadow="lg"
            isDismissable={false}
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            placement="center"
            backdrop="opaque"
            size="lg"
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
                        {!submitted && (
                            <form onSubmit={(e)=> {
                            e.preventDefault();
                            handleSubmission(onClose);
                            }}>
                            <Skeleton isLoaded={EntryData.resource}>
                                <ModalHeader className="flex flex-col gap-1">{EntryData && EntryData.resource ? EntryData.resource.name : (
                                    <Spinner color="default"/>)}
                                </ModalHeader>
                            </Skeleton>
                            <Skeleton isLoaded={EntryData.resource}>
                                <ModalBody>
                                    <div className="flex flex-col space-y-2 text-lg">
                                        <div className="flex flex-row w-full mb-2 text-sm uppercase font-semibold">
                                            <div className="flex justify-start items-center w-2/5 ">
                                                {formatDate(EntryData.date.start)}
                                            </div>
                                            <div className="w-1/5 relative">
                                                <div
                                                    className="animate-ping absolute inset-1 inset-x-8 -inset-y-0.5  h-6 w-6 inline-flex rounded-full bg-sky-400 opacity-75"></div>
                                                <ArrowRightCircleIcon className="absolute inset-0 m-auto" width="32"
                                                                      height="32" color="blue"/>
                                            </div>
                                            <div className="flex justify-end items-center w-2/5">
                                                {formatDate(EntryData.date.end)}
                                            </div>
                                        </div>
                                        <Divider orientation="horizontal" className="bg-neutral-950 opacity-25"/>
                                        <div className="my-2">
                                            <Textarea
                                                name="comment"
                                                id="comment"
                                                labelPlacement="outside"
                                                placeholder="Écrire un commentaire"
                                                size='lg'
                                                variant="bordered"
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* OPTIONS BY RESOURCES */}
                                        <div className="flex flex-col justify-between my-6">
                                            {EntryData?.resource?.moderate && (
                                                <div className="flex flex-row items-center space-x-4 my-2">
                                                    <Button size="sm" radius="full" color="danger" isIconOnly
                                                            variant="solid" disabled={true}>
                                                        <ShieldExclamationIcon className="w-6 h-6" color="white"/>
                                                    </Button>
                                                    <span className="text-sm">Votre réservation doit-être confirmé par un administrateur</span>
                                                </div>
                                            )}
                                            {/* OPTIONS BY RESOURCES ==> ADD MORE OPTIONS HERE LATER */}

                                        </div>

                                        <Divider orientation="horizontal" className="bg-neutral-800 opacity-25"/>
                                        <div>
                                        <span className="flex flex-col space-y-2 text-slate-700 mt-2">
                                            <span className="font-bold text-lg">Conditions d&apos;utilisation</span>
                                            <span className="text-slate-500 text-sm">
                                                La ressource doit être restituée dans le délai indiqué. Pour confirmer
                                                l&apos;utilisation de la ressource et son retour, vous devrez saisir un code
                                                à 6 chiffres qui vous sera envoyé par mail pour confirmer le pickup et le retour de la ressource.
                                            </span>
                                            <Checkbox id="cgu"
                                                      name="cgu"
                                                      required
                                                      onChange={(e)=>handleInputChange(e)}
                                                      radius="md"
                                                      value={formData.cgu}
                                                      disableAnimation
                                            >
                                                J&apos;accepte les conditions
                                            </Checkbox>

                                        </span>
                                        </div>

                                    </div>
                                </ModalBody>
                                </Skeleton>
                                    <ModalFooter>
                                        <Skeleton isLoaded={EntryData.resource}>
                                            <div className="flex flex-row space-x-2">
                                                <Button color="danger" variant="light" disableAnimation size="lg" onPress={onClose}>
                                                    Annuler
                                                </Button>
                                                <Button color="primary" variant="light" type="submit" disableAnimation size="lg" >
                                                    {!EntryData.resource.moderate ? "Réserver" : "Demander"}
                                                </Button>
                                            </div>

                                        </Skeleton>

                                    </ModalFooter>
                                </form>
                        )}
                    </>
                )}
            </ModalContent>
        </Modal>
        </>
    )
}