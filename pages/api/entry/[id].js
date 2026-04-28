import db from "@/server/services/databaseService";
import {runMiddleware} from "@/services/server/core";
import {NextResponse} from 'next/server';
import {isAdminSession, requireAuth} from '@/services/server/api-auth';

export default async function handler(req, res) {

    await runMiddleware(req, res);
    const session = req.method === 'OPTIONS' ? null : await requireAuth(req, res);
    if (req.method !== 'OPTIONS' && !session) return;

    const { id } = req.query;

    if (req.method === "PUT") {
        try {
            const {moderate, returned, adminNote, startDate, endDate, resourceId, userId} = req.body;
            const currentEntryForAuth = await db.entry.findUnique({where: {id: parseInt(id)}});
            if (!currentEntryForAuth) return res.status(404).json({error: 'Entry not found'});

            const adminOnlyChange = adminNote || startDate || endDate || resourceId || userId;
            if (!isAdminSession(session) && (currentEntryForAuth.userId !== Number(session.user.id) || adminOnlyChange)) {
                return res.status(403).json({message: 'Accès interdit'});
            }

            // Si on modifie les horaires ou la ressource, vérifier la disponibilité
            if (startDate || endDate || resourceId) {
                const currentEntry = await db.entry.findUnique({
                    where: {id: parseInt(id)},
                    include: {resource: true}
                });

                const newStartDate = startDate || currentEntry.startDate;
                const newEndDate = endDate || currentEntry.endDate;
                const newResourceId = resourceId || currentEntry.resourceId;

                // Vérifier les conflits (exclure la réservation actuelle)
                const conflicts = await db.entry.findMany({
                    where: {
                        resourceId: parseInt(newResourceId),
                        id: {not: parseInt(id)},
                        moderate: {in: ['ACCEPTED', 'USED', 'WAITING']},
                        OR: [
                            {
                                startDate: {lt: new Date(newEndDate)},
                                endDate: {gt: new Date(newStartDate)}
                            }
                        ]
                    }
                });

                if (conflicts.length > 0) {
                    return res.status(409).json({
                        error: "Conflit de réservation",
                        message: "La ressource n'est pas disponible sur ces horaires"
                    });
                }
            }

            const updateData = {
                ...(moderate && {moderate}),
                ...(adminNote && {adminNote}),
                ...(returned && {
                    returned: returned,
                    endDate: new Date()
                }),
                ...(startDate && {startDate: new Date(startDate)}),
                ...(endDate && {endDate: new Date(endDate)}),
                ...(resourceId && {resourceId: parseInt(resourceId)}),
                ...(userId && {userId: parseInt(userId)})
            };

            const entry = await db.entry.update({
                where: {
                    id: parseInt(id)
                },
                data: updateData,
                include: {
                    resource: true,
                    user: true
                }
            });

            // Mettre à jour le statut de la ressource si nécessaire
            if (moderate === "USED" || moderate === "ENDED") {
                await db.resource.update({
                    where: {
                        id: entry.resource.id
                    },
                    data: {
                        status: moderate === "USED" ? "UNAVAILABLE" : "AVAILABLE"
                    }
                });
            }
            
            return res.status(200).json(entry);
        } catch (error) {
            console.error("Failed to update entry:", error);
            return res.status(500).json({error: "Failed to update entry"});
        }
    } else if(req.method === "DELETE"){
        const { id } = req.query;

        // Récupérer la réservation avant suppression pour connaître la ressource
        const entry = await db.entry.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                resource: true
            }
        });

        if (!entry) {
            return res.status(404).json({error: "Entry not found"});
        }
        if (!isAdminSession(session) && entry.userId !== Number(session.user.id)) {
            return res.status(403).json({message: 'Accès interdit'});
        }

        const resourceId = entry.resourceId;

        // Supprimer la réservation
        await db.entry.delete({
            where: {
                id: parseInt(id)
            }
        });

        // Mettre à jour le statut de la ressource après suppression
        if (resourceId) {
            // Si on supprime une réservation, la ressource redevient automatiquement disponible
            await db.resource.update({
                where: {
                    id: resourceId
                },
                data: {
                    status: 'AVAILABLE'
                }
            });
        }

        res.status(200).json({message: "Entry deleted successfully"});
    } else if (req.method === "OPTIONS") {
        // Gérer la requête preflight OPTIONS
        const response = NextResponse.next();
        res.setHeader('Allow', ['PUT', 'DELETE', 'OPTIONS']);
        res.writeHead(204, Object.fromEntries(response.headers.entries()));
        res.end();
    } else {
        return res.status(405).json({message: "Method not allowed"});
    }
}
