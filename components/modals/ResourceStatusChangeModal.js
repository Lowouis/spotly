'use client';

import React, {useEffect, useState} from "react";
import {
    Button,
    Chip,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Textarea,
    Tooltip
} from "@heroui/react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {addToast} from "@heroui/toast";
import {useRefreshContext} from "@/context/RefreshContext";

// Fonction pour récupérer les réservations futures d'une ressource
const fetchFutureReservations = async (resourceId) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?resourceId=${resourceId}&future=true`);
    if (!response.ok) {
        throw new Error('Erreur lors de la récupération des réservations');
    }
    return response.json();
};

// Fonction pour chercher une ressource similaire disponible
const findSimilarResource = async (resourceId, startDate, endDate) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/resources/similar?resourceId=${resourceId}&startDate=${startDate}&endDate=${endDate}`);
    if (!response.ok) {
        throw new Error('Erreur lors de la recherche de ressource similaire');
    }
    return response.json();
};

// Fonction pour modifier une réservation (réutilisation de l'API existante)
const updateReservation = async (reservationId, newResourceId) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${reservationId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            resourceId: newResourceId
        }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la modification de la réservation');
    }
    return response.json();
};

// Fonction pour envoyer l'email de notification de changement de ressource
const sendResourceChangedEmail = async (reservationId, oldResourceId, newResourceId, reason) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/mail/send-resource-changed`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            reservationId,
            oldResourceId,
            newResourceId,
            reason
        }),
    });
    if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'email de notification');
    }
    return response.json();
};

// Fonction pour envoyer l'email de notification
const sendNotificationEmail = async (resourceId, message, affectedReservations) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/mail/send-resource-unavailable`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            resourceId,
            message,
            affectedReservations
        }),
    });
    if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de l\'email');
    }
    return response.json();
};

export default function ResourceStatusChangeModal({
                                                      isOpen,
                                                      onOpenChange,
                                                      resource,
                                                      onStatusChange
                                                  }) {
    const [message, setMessage] = useState("");
    const [processingReservations, setProcessingReservations] = useState(new Set());
    const [changedReservations, setChangedReservations] = useState(new Map()); // Map pour stocker les nouvelles ressources
    const {refreshData} = useRefreshContext();

    // Récupérer les réservations futures
    const {data: futureReservations, isLoading: loadingReservations} = useQuery({
        queryKey: ['futureReservations', resource?.id],
        queryFn: () => fetchFutureReservations(resource.id),
        enabled: isOpen && !!resource?.id,
    });

    // Fermer automatiquement le modal si toutes les ressources ont été changées
    useEffect(() => {
        if (isOpen && futureReservations && futureReservations.length > 0) {
            const allChanged = futureReservations.every(reservation =>
                changedReservations.has(reservation.id)
            );

            if (allChanged) {
                // Attendre un peu pour que l'utilisateur voie le résultat
                const timer = setTimeout(() => {
                    addToast({
                        title: "Toutes les ressources ont été changées",
                        description: "Le modal se ferme automatiquement",
                        color: "success"
                    });
                    onStatusChange();
                    onOpenChange(false);
                }, 2000); // 2 secondes de délai

                return () => clearTimeout(timer);
            }
        }
    }, [changedReservations, futureReservations, isOpen, onStatusChange, onOpenChange]);

    // Mutation pour changer la ressource d'une réservation
    const changeResourceMutation = useMutation({
        mutationFn: ({reservationId, newResourceId}) => updateReservation(reservationId, newResourceId),
        onSuccess: async (data, variables) => {
            setProcessingReservations(prev => {
                const newSet = new Set(prev);
                newSet.delete(variables.reservationId);
                return newSet;
            });

            // Stocker la nouvelle ressource pour l'affichage
            setChangedReservations(prev => new Map(prev).set(variables.reservationId, data.resource));

            // Envoyer l'email de notification
            try {
                await sendResourceChangedEmail(
                    variables.reservationId,
                    resource.id,
                    variables.newResourceId,
                    message || "Ressource devenue indisponible"
                );
            } catch (error) {
                console.error("Erreur lors de l'envoi de l'email:", error);
                // Afficher un toast informatif au lieu de bloquer le processus
                addToast({
                    title: "Email non envoyé",
                    description: "Le serveur SMTP n'est pas configuré. La ressource a été changée mais l'utilisateur n'a pas été notifié.",
                    color: "warning"
                });
            }

            addToast({
                title: "Réservation modifiée",
                description: "La ressource de la réservation a été changée avec succès",
                color: "success"
            });
            refreshData(['entries']);
        },
        onError: (error, variables) => {
            setProcessingReservations(prev => {
                const newSet = new Set(prev);
                newSet.delete(variables.reservationId);
                return newSet;
            });
            addToast({
                title: "Erreur",
                description: error.message,
                color: "danger"
            });
        }
    });

    // Mutation pour envoyer l'email de notification
    const sendEmailMutation = useMutation({
        mutationFn: () => sendNotificationEmail(resource.id, message, futureReservations),
        onSuccess: () => {
            addToast({
                title: "Notification envoyée",
                description: "Les utilisateurs ont été notifiés par email",
                color: "success"
            });
            onOpenChange(false);
        },
        onError: (error) => {
            // Afficher un toast informatif au lieu d'une erreur bloquante
            addToast({
                title: "Email non envoyé",
                description: "Le serveur SMTP n'est pas configuré. Les utilisateurs n'ont pas été notifiés.",
                color: "warning"
            });
            // Continuer le processus même si l'email échoue
            onStatusChange();
            onOpenChange(false);
        }
    });

    const handleChangeResource = async (reservation) => {
        setProcessingReservations(prev => new Set(prev).add(reservation.id));

        try {
            // Chercher une ressource similaire disponible
            const similarResource = await findSimilarResource(
                resource.id,
                reservation.startDate,
                reservation.endDate
            );

            if (similarResource) {
                // Changer la ressource de la réservation en utilisant l'API existante
                await changeResourceMutation.mutateAsync({
                    reservationId: reservation.id,
                    newResourceId: similarResource.id
                });
            } else {
                setProcessingReservations(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(reservation.id);
                    return newSet;
                });
                addToast({
                    title: "Aucune ressource disponible",
                    description: "Aucune ressource similaire n'est disponible pour cette période",
                    color: "warning"
                });
            }
        } catch (error) {
            setProcessingReservations(prev => {
                const newSet = new Set(prev);
                newSet.delete(reservation.id);
                return newSet;
            });
            addToast({
                title: "Erreur",
                description: error.message,
                color: "danger"
            });
        }
    };

    const handleConfirmStatusChange = () => {
        // Si il y a des réservations futures et un message, envoyer l'email
        if (futureReservations?.length > 0 && message.trim()) {
            sendEmailMutation.mutate();
        } else {
            // Sinon, procéder directement au changement de statut
            onStatusChange();
            onOpenChange(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("fr-FR", {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderActionButton = (reservation) => {
        const isProcessing = processingReservations.has(reservation.id);
        const newResource = changedReservations.get(reservation.id);

        if (newResource) {
            // Afficher la nouvelle ressource attribuée
            return (
                <div className="flex flex-col items-center space-y-1">
                    <Chip
                        color="success"
                        size="sm"
                        variant="flat"
                        className="text-xs"
                    >
                        {newResource.name}
                    </Chip>
                    <span className="text-xs text-neutral-500">
                        Ressource attribuée
                    </span>
                </div>
            );
        }

        // Afficher le bouton de changement
        return (
            <Tooltip
                content="Changer la ressource pour une similaire"
                color="foreground"
                showArrow
            >
                <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    isLoading={isProcessing}
                    onPress={() => handleChangeResource(reservation)}
                >
                    Changer
                </Button>
            </Tooltip>
        );
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl">
            <ModalContent>
                <ModalHeader>
                    <h3 className="text-lg font-semibold">
                        Cette ressource a des réservations futures qui seront affectées
                    </h3>
                </ModalHeader>

                <ModalBody>
                    {loadingReservations ? (
                        <div className="flex justify-center items-center py-8">
                            <Spinner label="Chargement des réservations..."/>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Liste des réservations futures */}
                            {futureReservations && futureReservations.length > 0 && (
                                <div>
                                    <h4 className="text-md font-semibold mb-3">
                                        Réservations futures ({futureReservations.length})
                                    </h4>
                                    <Table aria-label="Réservations futures">
                                        <TableHeader>
                                            <TableColumn>Utilisateur</TableColumn>
                                            <TableColumn>Date de début</TableColumn>
                                            <TableColumn>Date de fin</TableColumn>
                                            <TableColumn>Actions</TableColumn>
                                        </TableHeader>
                                        <TableBody>
                                            {futureReservations.map((reservation) => (
                                                <TableRow key={reservation.id}>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {reservation.user?.name} {reservation.user?.surname}
                                                            </span>
                                                            <span className="text-sm text-neutral-500">
                                                                {reservation.user?.email}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(reservation.startDate)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatDate(reservation.endDate)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {renderActionButton(reservation)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Message de notification */}
                            <div>
                                <h4 className="text-md font-semibold mb-3">
                                    Message de notification
                                </h4>
                                <Textarea
                                    placeholder="Expliquez pourquoi la ressource devient indisponible..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    minRows={3}
                                    maxRows={6}
                                    className="w-full"
                                />
                                <p className="text-sm text-neutral-500 mt-2">
                                    Ce message sera envoyé aux utilisateurs concernés
                                </p>
                            </div>
                        </div>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button
                        color="default"
                        variant="light"
                        onPress={() => onOpenChange(false)}
                    >
                        Annuler
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleConfirmStatusChange}
                        isLoading={sendEmailMutation.isPending}
                    >
                        {futureReservations?.length > 0 && message.trim() ? "Prévenir et continuer" : "Continuer"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
