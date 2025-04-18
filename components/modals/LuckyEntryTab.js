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
import {ArrowLeftCircleIcon, ArrowRightCircleIcon, ClockIcon} from "@heroicons/react/24/outline";
import {useQuery} from "@tanstack/react-query";
import {lastestPickable} from "@/global";
import {addToast} from "@heroui/toast";
import {fetchIP} from '@/utils/api';

export default function LuckyEntryTab({setSelected}) {
    const [ifl, setIfl] = useState({"username": "", "otp": ""});
    const {isOpen, onOpen, onOpenChange} = useDisclosure();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const {data: clientIP} = useQuery({
        queryKey: ['clientIP'],
        queryFn: fetchIP,
        staleTime: 1000 * 60 * 5,
    });

    const [entry, setEntry] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleResourceAction = async () => {
        setIsActionLoading(true);
        try {
            if (lastestPickable(entry)?.name === "HIGH_AUTH") {
                const isAuthorized = await checkIPAuthorization(clientIP);
                if (!isAuthorized) {
                    return;
                }
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${entry.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    moderate: entry.moderate === "ACCEPTED" ? "USED" : "ENDED",
                    returned: entry.moderate === "USED"
                })
            });

            if (!response.ok) {
                addToast({
                    title: "Erreur",
                    description: "Une erreur est survenue lors de l'action",
                    timeout: 5000,
                    variant: "solid",
                    radius: "sm",
                    color: "danger"
                })
                throw new Error('Failed to update entry');
            }

            addToast({
                title: entry.moderate === "ACCEPTED" ?
                    "La ressource a bien été récupérée" :
                    "La ressource a bien été retournée",
                description: "Vous pouvez la retrouver dans la section 'Mes réservations'",
                timeout: 5000,
                variant: "solid",
                radius: "sm",
                color: "success"
            });

            await fetchEntry();
        } catch (error) {
            addToast({
                title: "Erreur",
                description: "Une erreur est survenue lors de l'action",
                timeout: 5000,
                variant: "solid",
                radius: "sm",
                color: "danger"
            });
        } finally {
            setIsActionLoading(false);
        }
    };

    const fetchEntry = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?returnedConfirmationCode=${ifl.otp}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const result = data.length > 0 ? data[0] : null;

            if (result && (lastestPickable(result)?.name === "HIGH_AUTH" || lastestPickable(result)?.name === "LOW_AUTH")) {
                setEntry(result);
                onOpen();
            } else {
                addToast({
                    title: "Erreur d'authentification",
                    description: "Code de réservation invalide.",
                    timeout: 5000,
                    variant: "solid",
                    radius: "sm",
                    color: "danger"
                });
            }
        } catch (error) {
            addToast({
                title: "Erreur d'authentification",
                description: "Une erreur à eu lieu lors de récupération de votre réservation.",
                timeout: 5000,
                variant: "solid",
                radius: "sm",
                color: "danger"
            });
        } finally {
            setIsLoading(false);
        }
    };


    // Add this function near the top with other functions
    const checkIPAuthorization = async (ip) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/authorized-location/check/${ip}`);
            if (response.status === 401) {
                addToast({
                    title: "Accès refusé",
                    description: "Cet appareil n'est pas autorisé à effectuer cette action.",
                    timeout: 5000,
                    variant: "solid",
                    radius: "sm",
                    color: "danger"
                });
                return false;
            }
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return true;
        } catch (error) {
            addToast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la vérification de l'appareil.",
                timeout: 5000,
                variant: "solid",
                radius: "sm",
                color: "danger"
            });
            return false;
        }
    };

    // Modify the conditional rendering of the buttons
    {
        entry && entry.moderate === "ACCEPTED" && (
            lastestPickable(entry)?.name === "HIGH_AUTH" ? (
                <div className="space-y-4">
                    <Button
                        color="primary"
                        className="w-full font-medium"
                        size="lg"
                        onPress={async () => {
                            if (await checkIPAuthorization(clientIP)) {
                                fetchEntry();
                            } else {
                                addToast({
                                    title: "Accès refusé",
                                    description: "Cette action n&apos;est pas autorisée depuis cet appareil.",
                                    timeout: 5000,
                                    variant: "solid",
                                    radius: "sm",
                                    color: "danger"
                                });
                            }
                        }}
                    >
                        Récupérer la ressource
                    </Button>
                    <p className="text-xs text-neutral-500 text-center">
                        Cette action nécessite une autorisation spéciale de l'appareil
                    </p>
                </div>
            ) : (
                <Button
                    color="primary"
                    className="w-full font-medium"
                    size="lg"
                    onPress={() => fetchEntry()}
                >
                    Récupérer la ressource
                </Button>
            )
        )
    }

    return (
        <>
            <Form
                className="flex flex-col space-y-6 justify-between items-center p-4 w-full"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (ifl.otp.length === 6) {
                        fetchEntry();
                    }
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
                        >Vérifier le code</Button>
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
                            content={<span>Pour réserver une ressource rendez-vous dans la section <span
                                className="italic">Se connecter</span>.</span>}
                        >
                            <Button
                                onPress={() => setSelected("login")}
                                isIconOnly
                                size="sm"
                                variant="light"
                                radius="full"
                                className="bg-neutral-100 dark:bg-neutral-800"
                            >
                                ?
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
                                    <h3 className="text-xl font-semibold text-neutral-500">
                                        {entry?.resource.name}
                                    </h3>
                                    <p className="text-sm text-neutral-600">
                                        État : <span className={`font-medium ${
                                        new Date(entry.endDate) < new Date() && !entry.returned ? "text-red-500" :
                                            entry.moderate === "ACCEPTED" ? "text-green-500" :
                                                entry.moderate === "USED" ? "text-blue-500" :
                                                    entry.moderate === "ENDED" ? "text-neutral-500" :
                                                        "text-neutral-500"
                                    }`}>
                                    {new Date(entry.endDate) < new Date() && !entry.returned ? "Expiré" :
                                        entry.moderate === "ACCEPTED" ? "À récupérer" :
                                            entry.moderate === "USED" ? "En cours d'utilisation" :
                                                entry.moderate === "ENDED" ? "Terminé" :
                                                    "Non disponible"}
                                </span>
                                    </p>
                                </ModalHeader>

                                <ModalBody>
                                    <div className="space-y-6">
                                        <div className="flex flex-row w-full text-sm uppercase font-medium">
                                            <div className="flex-1 space-y-1">
                                                <p className="text-neutral-500">Début</p>
                                                <p className="text-neutral-900 dark:text-neutral-100">{new Date(entry?.startDate).toLocaleString("fr-FR", {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</p>
                                            </div>
                                            <div className="w-20 flex items-center justify-center">
                                                <div className="relative">
                                                    <div
                                                        className="animate-ping absolute inset-0 rounded-full bg-sky-400 opacity-20"></div>
                                                    <ArrowRightCircleIcon
                                                        className="relative z-10 w-8 h-8 text-sky-500"/>
                                                </div>
                                            </div>
                                            <div className="flex-1 text-right space-y-1">
                                                <p className="text-neutral-500">Fin</p>
                                                <p className="text-neutral-900 dark:text-neutral-100">{new Date(entry?.endDate).toLocaleString("fr-FR", {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</p>
                                            </div>
                                        </div>

                                        {new Date(entry.endDate) < new Date() && !entry.returned && (
                                            <div
                                                className="flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                <ClockIcon className="w-5 h-5 text-red-500 mr-2"/>
                                                <span className="text-red-600 dark:text-red-400 font-medium">
                                            Réservation expirée
                                        </span>
                                            </div>
                                        )}
                                        {entry.moderate === "ACCEPTED" && new Date(entry.endDate) > new Date() && (
                                            <Button
                                                color="primary"
                                                className="w-full font-medium bg-gradient-to-r from-blue-500 to-blue-600"
                                                size="lg"
                                                isLoading={isActionLoading}
                                                onPress={handleResourceAction}
                                                startContent={<ArrowRightCircleIcon className="w-5 h-5"/>}
                                            >
                                                Récupérer la ressource
                                            </Button>
                                        )}

                                        {entry.moderate === "USED" && (
                                            <Button
                                                color="success"
                                                className="w-full font-medium bg-gradient-to-r from-green-500 to-green-600"
                                                size="lg"
                                                isLoading={isActionLoading}
                                                onPress={handleResourceAction}
                                                startContent={<ArrowLeftCircleIcon className="w-5 h-5"/>}
                                            >
                                                Restituer la ressource
                                            </Button>
                                        )}
                                    </div>
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