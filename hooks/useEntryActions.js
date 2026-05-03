import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useEmail} from "@/features/shared/context/EmailContext";
import {addToast} from "@/lib/toast";
import {checkIPAuthorization} from '@/services/client/api';
import {lastestPickable} from "@/global";

export const useEntryActions = (entry, clientIP) => {
    const {mutate: sendEmail} = useEmail();
    const [isPickupLoading, setIsPickupLoading] = useState(false);
    const [isReturnLoading, setIsReturnLoading] = useState(false);

    // IP Authorization check for HIGH_AUTH resources
    const {data: isIPAuthorized = true} = useQuery({
        queryKey: ['ip-authorization', clientIP, entry?.id],
        enabled: !!clientIP && !!entry && lastestPickable(entry)?.name === "HIGH_AUTH",
        queryFn: async () => {
            return await checkIPAuthorization(clientIP);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Time schedule options
    const {data: timeScheduleOptions, isLoading: isLoadingTSO} = useQuery({
        queryKey: ['timeScheduleOptions', entry?.id],
        enabled: !!entry,
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/timeScheduleOptions`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des options de planification');
            }
            const data = await response.json();
            return entry ? {
                onPickup: data.onPickup,
                onReturn: data.onReturn,
                maxEarlyPickupMinutes: data.maxEarlyPickupMinutes || 0,
                ajustedStartDate: new Date(new Date(entry.startDate).getTime() - (data.onPickup || 0) * 60000).toISOString(),
                ajustedEndDate: new Date(new Date(entry.endDate).getTime() + (data.onReturn || 0) * 60000).toISOString(),
                flexiblePickupStartDate: new Date(new Date(entry.startDate).getTime() - (data.maxEarlyPickupMinutes || 0) * 60000).toISOString(),
            } : null;
        }
    });

    // Waitlist count
    const {data: waitlistCount = 0} = useQuery({
        queryKey: ['waitlist', entry?.resource?.id, entry?.startDate],
        enabled: !!entry?.resource?.id && !!entry?.startDate && new Date() < new Date(entry.startDate),
        refetchInterval: 60000,
        queryFn: async () => {
            const now = new Date();
            const start = new Date(entry.startDate);
            const nowIso = now.toISOString();
            const startIso = start.toISOString();

            const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?resourceId=${entry.resource?.id}&startDate=${encodeURIComponent(nowIso)}&endDate=${encodeURIComponent(startIso)}`;
            const res = await fetch(url, {credentials: 'include'});
            if (!res.ok) throw new Error('Erreur de récupération des réservations');
            const all = await res.json();
            const relevant = (all || []).filter(e => ['ACCEPTED', 'USED', 'WAITING'].includes(e.moderate) && e.id !== entry.id);
            return relevant.length;
        }
    });

    // Previous not returned
    const {data: previousNotReturned} = useQuery({
        queryKey: ['prev-not-returned', entry?.resource?.id, entry?.startDate],
        enabled: !!entry?.resource?.id && !!entry?.startDate && new Date() >= new Date(entry.startDate),
        refetchInterval: 60000,
        queryFn: async () => {
            const startForPrev = new Date(entry.startDate);
            const since = new Date(startForPrev.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString();
            const url = `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?resourceId=${entry.resource?.id}&startDate=${encodeURIComponent(since)}&endDate=${encodeURIComponent(startForPrev.toISOString())}`;
            const res = await fetch(url, {credentials: 'include'});
            if (!res.ok) throw new Error('Erreur récupération précédente');
            const all = await res.json();
            const candidates = (all || []).filter(e => new Date(e.endDate) < startForPrev && e.returned === false && e.id !== entry.id);
            if (candidates.length === 0) return null;
            candidates.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
            return candidates[0];
        }
    });

    // Computed values
    const validDatesToPickup = () => {
        if (!entry || isLoadingTSO || !timeScheduleOptions) return false;
        const nowIso = new Date().toISOString();
        const regularAllowed = timeScheduleOptions.ajustedStartDate <= nowIso;
        const flexibleAllowed = timeScheduleOptions.maxEarlyPickupMinutes > 0
            && timeScheduleOptions.flexiblePickupStartDate <= nowIso
            && entry?.resource?.status === 'AVAILABLE'
            && waitlistCount === 0;
        return regularAllowed || flexibleAllowed;
    };

    const hasBlockingPrevious = !!entry && new Date(entry.startDate) <= new Date() && entry?.resource?.status === 'UNAVAILABLE' && !!previousNotReturned;

    const isAbleToPickUp = () => {
        if (!entry) return false;
        const resourceAvailable = entry?.resource?.status === 'AVAILABLE';
        const noQueue = waitlistCount === 0;
        const ipAuthorized = lastestPickable(entry)?.name === "HIGH_AUTH" ? isIPAuthorized : true;

        return (entry.moderate === "ACCEPTED")
            && new Date(entry?.endDate) > new Date()
            && validDatesToPickup()
            && resourceAvailable
            && noQueue
            && !hasBlockingPrevious
            && ipAuthorized;
    };

    const getPickupUnavailableReason = () => {
        if (!entry) return "Réservation introuvable";
        if (hasBlockingPrevious) return "Ressource non restituée par l'emprunteur précédent";
        if (!isIPAuthorized && lastestPickable(entry)?.name === "HIGH_AUTH") return "Accès interdit depuis cet appareil";
        if (entry?.resource?.status !== 'AVAILABLE') return "Ressource indisponible pour le moment";
        if (waitlistCount > 0) return "Une réservation est prévue avant la vôtre";
        if (timeScheduleOptions?.maxEarlyPickupMinutes === 0 && timeScheduleOptions?.ajustedStartDate > new Date().toISOString()) return "La récupération anticipée est désactivée";
        if (timeScheduleOptions?.flexiblePickupStartDate > new Date().toISOString()) return "Revenez plus tard";
        return "Conditions de récupération non réunies";
    };

    // Action handlers
    const handlePickUp = async (onClose, handleRefresh) => {
        setIsPickupLoading(true);
        try {
            // Enforce pickup constraints
            if (!isAbleToPickUp()) {
                addToast({
                    title: "Indisponible",
                    description: getPickupUnavailableReason(),
                    timeout: 5000,
                    color: "warning"
                });
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${entry.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({moderate: "USED"})
            });

            if (!response.ok) {
                throw new Error('Failed to update entry');
            }

            addToast({
                title: "Pick-up",
                description: "La récupération de la ressource a bien été prise en compte.",
                timeout: 5000,
                color: "primary"
            });

            if (handleRefresh) handleRefresh();
            if (onClose) onClose();
        } catch (error) {
            addToast({
                title: "Erreur",
                description: "La ressource n'a pas pu être modifiée. Si le problème persiste, contactez un administrateur.",
                timeout: 5000,
                color: "danger"
            });
        } finally {
            setIsPickupLoading(false);
        }
    };

    const handleReturn = async (onClose, handleRefresh) => {
        setIsReturnLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${entry.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    moderate: "ENDED",
                    returned: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update entry');
            }

            // Send confirmation email
            sendEmail({
                to: entry.user.email,
                subject: "Confirmation de restitution - " + entry.resource.name,
                templateName: "reservationReturnedConfirmation",
                data: {
                    resource: entry.resource,
                    endDate: entry.endDate,
                }
            });

            addToast({
                title: "Restitution",
                description: "La ressource a bien été retournée.",
                timeout: 5000,
                color: "success"
            });

            if (handleRefresh) handleRefresh();
            if (onClose) onClose();
        } catch (error) {
            addToast({
                title: "Erreur",
                description: "La ressource n'a pas pu être modifiée. Si le problème persiste, contactez un administrateur.",
                timeout: 5000,
                color: "danger"
            });
        } finally {
            setIsReturnLoading(false);
        }
    };

    return {
        timeScheduleOptions,
        isLoadingTSO,
        waitlistCount,
        previousNotReturned,
        hasBlockingPrevious,
        isAbleToPickUp,
        isIPAuthorized,
        isPickupLoading,
        isReturnLoading,
        pickupUnavailableReason: getPickupUnavailableReason(),
        handlePickUp,
        handleReturn
    };
};
