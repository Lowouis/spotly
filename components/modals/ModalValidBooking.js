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
import {constructDate, whoIsOwner} from "@/global";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useEmail} from "@/context/EmailContext";
import {getEmailTemplate} from "@/utils/mails/templates";
import {addToast} from "@heroui/toast";
import {lastestPickable} from "@/global";
export default function ModalValidBooking({entry, isOpen, onOpenChange, session, handleRefresh}) {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        comment: "",
        cgu: false,
    });
    const { mutate: sendEmail } = useEmail();
    const queryClient = useQueryClient();

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === "checkbox" ? checked : value
        }));
    };
    const mutation = useMutation({
        mutationFn: async (newEntry) => {
            console.log(newEntry);
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
            console.log("Début du mutate");
            handleRefresh();
            queryClient.invalidateQueries({queryKey: ['isAvailable']})
            if(data.moderate === "WAITING") {
                const owner = whoIsOwner(data);
                sendEmail({
                    "to": session.user.email,
                    "subject": "Demande de réservation Spotly - " + entry.resource.name,
                    "text": getEmailTemplate("reservationRequestUser",
                        {
                            name: session.user.surname,
                            resource: entry.resource.name,
                            domain: entry.resource.domains.name,
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
                    "subject": "Nouvelle demande de réservation Spotly - " + entry.resource.name,
                    "text": getEmailTemplate("reservationRequestOwner",
                        {
                            user: data.user.surname,
                            resource: entry.resource.name,
                            owner : owner.name + " " + owner.surname,
                            domain: entry.resource.domains.name,
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
            console.log("Fin du mutate");
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
            mutation.mutate({
                startDate: entry.date.start,
                endDate: entry.date.end,
                category: entry.category,
                site: entry.site,
                resourceId: entry.resource.id,
                userId: session.user.id,
                comment: formData.comment,
                resource: entry.resource.moderate ? "WAITING" : "ACCEPTED",
            });
            setSubmitted(true);
            handleRefresh()
            onClose();
        }
    };

    return (
        <>
        <Modal
            shadow="lg"
            isDismissable={true}
            hideCloseButton={false}
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
                                <Skeleton isLoaded={entry.resource}>
                                    <ModalHeader
                                        className="flex flex-col gap-1 text-neutral-700 dark:text-neutral-300">{entry && entry.resource ? entry.resource.name : (
                                        <Spinner color="default"/>
                                    )}
                                </ModalHeader>
                            </Skeleton>
                                <Skeleton isLoaded={entry.resource}>
                                <ModalBody>
                                    <div className="flex flex-col space-y-4 text-base lg:text-lg">
                                        <div
                                            className="flex flex-row w-full mb-4 text-xs md:text-sm uppercase font-semibold tracking-wide">
                                            <div
                                                className="flex justify-start items-center w-2/5 text-neutral-700 dark:text-neutral-300">
                                                {formatDate(entry.date.start)}
                                            </div>
                                            <div className="w-1/5 relative flex justify-center items-center">
                                                <div className="relative w-6 h-6 md:w-8 md:h-8">
                                                    <div
                                                        className="animate-ping absolute inset-0 rounded-full bg-neutral-400/75"/>
                                                    <ArrowRightCircleIcon
                                                        className="absolute inset-0 text-neutral-600 dark:text-neutral-400"/>
                                                </div>
                                            </div>
                                            <div
                                                className="flex justify-end items-center w-2/5 text-neutral-700 dark:text-neutral-300">
                                                {formatDate(entry.date.end)}
                                            </div>
                                        </div>
                                        <Divider orientation="horizontal"
                                                 className="bg-neutral-200 dark:bg-neutral-700"/>
                                        <div className="my-4">
                                            <Textarea
                                                name="comment"
                                                id="comment"
                                                labelPlacement="outside"
                                                placeholder="Écrire un commentaire"
                                                size='lg'
                                                variant="flat"
                                                className="w-full min-h-[100px]"
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* OPTIONS BY RESOURCES */}
                                        <div className="flex flex-col justify-between my-6 space-y-4">
                                            {entry?.resource?.moderate && (
                                                <div
                                                    className="flex flex-row items-center space-x-4 p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
                                                    <Button size="sm" radius="full" color="danger" isIconOnly
                                                            variant="solid" disabled={true}>
                                                        <ShieldExclamationIcon className="w-5 h-5 md:w-6 md:h-6"/>
                                                    </Button>
                                                    <span
                                                        className="text-xs md:text-sm text-danger-600 dark:text-danger-400">
                                                        Votre réservation doit-être confirmé par un administrateur
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <Divider orientation="horizontal"
                                                 className="bg-neutral-200 dark:bg-neutral-700"/>
                                        <div className="space-y-4 py-2">
                                            <span className="flex flex-col space-y-3">
                                                <span
                                                    className="font-semibold text-base lg:text-lg text-neutral-700 dark:text-neutral-300">
                                                    Conditions d&apos;utilisation
                                                </span>
                                                <span
                                                    className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">
                                                    {lastestPickable(entry)?.cgu}
                                                </span>
                                                <Checkbox
                                                    id="cgu"
                                                    name="cgu"
                                                    required
                                                    onChange={handleInputChange}
                                                    radius="sm"
                                                    color="default"
                                                    size="sm"
                                                    className="mt-2"
                                                    value={formData.cgu}
                                                >
                                                    <span className="text-sm">J&apos;accepte les conditions</span>
                                                </Checkbox>
                                            </span>
                                        </div>
                                    </div>
                                </ModalBody>
                                </Skeleton>
                                    <ModalFooter>
                                        <Skeleton isLoaded={entry.resource}>
                                            <div className="flex flex-row space-x-2">
                                                <Button color="default" variant="light" size="lg" onPress={onClose}>
                                                    Annuler
                                                </Button>
                                                <Button color="default" variant="light" type="submit" size="lg">
                                                    {!entry.resource.moderate ? "Réserver" : "Demander"}
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