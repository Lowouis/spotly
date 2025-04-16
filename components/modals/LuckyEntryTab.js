'use client';

import React, {useState} from "react";
import {
    Button,
    Form,
    InputOtp,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Tooltip,
    useDisclosure
} from "@nextui-org/react";
import {ArrowRightCircleIcon, ClockIcon} from "@heroicons/react/24/outline";
import {useMutation, useQuery} from "@tanstack/react-query";
import {lastestPickable} from "@/global";
import {addToast} from "@heroui/toast";
import {fetchIP, updateEntry} from '@/utils/api';

export default function LuckyEntryTab({setSelected}) {
    const [ifl, setIfl] = useState({"username": "", "otp": ""});
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const {data: clientIP} = useQuery({
        queryKey: ['clientIP'],
        queryFn: fetchIP,
        staleTime: 1000 * 60 * 5,
    });

    const {data: entry, isLoading} = useQuery({
        queryKey: ['lucky_entry', ifl.otp],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?returnedConfirmationCode=${ifl.otp}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.length > 0 ? data[0] : null;
        },
        enabled: isSubmitted,
        onSuccess: (data) => {
            if (data && (lastestPickable(data)?.name === "HIGH_AUTH" || lastestPickable(data)?.name === "LOW_AUTH")) {
                onOpen();
            } else {
                addToast({
                    title: "Erreur d'authentification",
                    description: "Vous n'êtes pas autorisé à effectuer cette action.",
                    timeout: 5000,
                    variant: "solid",
                    radius: "sm",
                    color: "danger"
                });
            }
        },
        onError: () => {
            addToast({
                title: "Erreur d'authentification",
                description: "Code de réservation invalide.",
                timeout: 5000,
                variant: "solid",
                radius: "sm",
                color: "danger"
            });
        }
    });

    const mutation = useMutation({
        mutationFn: updateEntry,
    });
    const handleSubmitLuckyEntry = async () => {


        console.log("entry", entry);
        lastestPickable(entry)?.name
        if (entry === null && entry === undefined) {
            console.log("rrr")
                addToast({
                    title: "Erreur d'authentification",
                    description: "Code de réservation invalide.",
                    timeout: 5000,
                    variant: "solid",
                    radius: "sm",
                    color: "danger"
                });
                return false;
        } else if (lastestPickable(entry)?.name === "HIGH_AUTH" || lastestPickable(entry)?.name === "LOW_AUTH") {
                return true;
            } else {
            return true;
            }
        setIsSubmitted(false);
    
    }
    const handleIFLActions = async () => {
        setIsActionLoading(true);
        try {
            // Check if client IP is authorized for HIGH_AUTH actions
            if (lastestPickable(entry).name === "HIGH_AUTH") {
                const isAuthorizedIP = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/authorized-location/check/${clientIP}`);
                if (!isAuthorizedIP.ok) {
                    addToast({
                        title: "Erreur d'authentification",
                        description: "Vous n'êtes pas autorisé à effectuer cette action dans avec cette appareil.",
                        timeout: 5000,
                        variant: "solid",
                        radius: "sm",
                        color: "danger"
                    });
                    return;
                }
            }
            if (entry.moderate === "ACCEPTED") {
                mutation.mutate({id: entry.id, moderate: "USED"});

                addToast({
                    title: "La ressource a bien été prise",
                    description: "Vous pouvez la retrouver dans la section 'Mes ressources'.",
                    timeout: 5000,
                    variant: "solid",
                    radius: "sm",
                    color: "success"
                })
            } else if (entry.moderate === "USED") {
                mutation.mutate({id: entry.id, moderate: "ENDED", returned: true});
                addToast({
                    title: "La ressource a bien été retourner",
                    description: "Vous pouvez la retrouver dans la section 'Mes réservations'.",
                    timeout: 5000,
                    variant: "solid",
                    radius: "sm",
                    color: "success"
                })
            }
            await refetch();
        } catch (error) {
            addToast({
                title: "Erreur d'authentification",
                description: "Une erreur est survenue",
                timeout: 5000,
                variant: "solid",
                radius: "sm",
                color: "danger"
            });
        } finally {
            setIsActionLoading(false);
        }
    }


    return (
        <>
            <Form
                className="flex flex-col space-y-6 justify-between items-center p-4 w-full"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmitLuckyEntry();
                    setIsSubmitted(true);
                }}
            >
                <div className="w-full">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-semibold mb-2 text-neutral-800 dark:text-neutral-200">
                            Accéder à ma réservation
                        </h2>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Entrez le code à 6 chiffres de votre réservation
                        </p>
                    </div>

                    <div className="flex flex-col items-center space-y-6">
                        <InputOtp
                            isRequired
                            name="lucky_otp"
                            size="lg"
                            length={6}
                            value={ifl.otp}
                            onChange={(e) => setIfl({...ifl, "otp": e.target.value})}
                            classNames={{
                                input: "bg-neutral-50 dark:bg-neutral-900 border-2",
                            }}
                        />

                        <Button
                            size="md"
                            fullWidth
                            type="submit"
                            color="primary"
                            className="font-medium"
                            isLoading={isLoading}
                            isDisabled={ifl.otp.length !== 6}
                        >
                            {isLoading ? "Vérification..." : "Vérifier le code"}
                        </Button>
                    </div>
                </div>

                <div className="w-full border-t border-neutral-200 dark:border-neutral-700 pt-4">
                    <div className="flex justify-center items-center space-x-2">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            Je n&apos;ai pas de réservation
                        </span>
                        <Tooltip
                            color="foreground"
                            showArrow
                            content="Pour réserver une ressource rendez-vous dans la section 'Se connecter'."
                        >
                            <Button
                                onPress={() => setSelected("login")}
                                isIconOnly
                                size="sm"
                                variant="light"
                                radius="full"
                                className="bg-neutral-100 dark:bg-neutral-800"
                            >
                                <span className="font-bold">?</span>
                            </Button>
                        </Tooltip>
                    </div>
                </div>
            </Form>

            {entry !== null && (
                <Modal
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    size="2xl"
                    classNames={{
                        base: "bg-white dark:bg-neutral-900",
                        header: "border-b border-neutral-200 dark:border-neutral-800",
                        body: "py-6",
                        footer: "border-t border-neutral-200 dark:border-neutral-800"
                    }}
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <h3 className="text-xl font-semibold">
                                        {entry?.resource.name}
                                    </h3>
                                </ModalHeader>

                                <ModalBody>
                                    {entry.moderate === "ACCEPTED" || entry.moderate === "USED" && entry.startDate <= new Date().toISOString() && lastestPickable(entry).name === "HIGH_AUTH" || lastestPickable(entry).name === "LOW_AUTH" ?
                                        <div>
                                            <div className="flex flex-row w-full text-sm uppercase font-semibold mb-5">
                                                <div className="flex justify-start items-center w-2/5 ">
                                                    {new Date(entry?.startDate).toLocaleString("fr-FR", {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                                <div className="w-1/5 relative">
                                                    <div
                                                        className="animate-ping absolute inset-1 inset-x-10 -inset-y-0.5  h-6 w-6 inline-flex rounded-full bg-sky-400 opacity-75"></div>
                                                    <ArrowRightCircleIcon className="absolute inset-0 m-auto" width="32"
                                                                          height="32" color="blue"/>
                                                </div>
                                                <div className="flex justify-end items-center w-2/5">
                                                    {new Date(entry?.endDate).toLocaleString("fr-FR", {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>

                                            {new Date(entry.endDate) < new Date() &&
                                                <div className="flex flex-col justify-start items-center mt-3">
                                                    <span className="font-semibold text-red-500">En retard</span>
                                                    <div className="flex flex-row space-x-1 text-red-400 font-semibold">
                                                            <span>
                                                                {new Date(new Date(entry.endDate) - new Date()).toLocaleString("FR-fr", {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        <ClockIcon className="h-5 w-5 inline-block mr-2  "/>
                                                    </div>
                                                </div>
                                            }
                                        </div> :
                                        <div className="text-center space-y-2 flex flex-col">
                                            <span className="font-bold">Votre réservation n&apos;est pas accessible par cette interface.</span>
                                            <span className="text-sm text-neutral-800">Pour la consulter, merci de vous connecter avec vos identifiants.</span>
                                        </div>
                                    }
                                </ModalBody>

                                <ModalFooter>
                                    <Button
                                        color="danger"
                                        variant="light"
                                        onPress={onClose}
                                        className="font-medium"
                                    >
                                        Fermer
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            )}
        </>
    );
}