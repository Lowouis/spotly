import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";
import {NextResponse} from 'next/server';

export default async function handler(req, res) {

    await runMiddleware(req, res);

    const { id } = req.query;

    if (req.method === "PUT") {
        try {
            const {moderate, returned, adminNote, startDate, endDate, resourceId, userId} = req.body;

            // Si on modifie les horaires ou la ressource, vérifier la disponibilité
            if (startDate || endDate || resourceId) {
                const currentEntry = await prisma.entry.findUnique({
                    where: {id: parseInt(id)},
                    include: {resource: true}
                });

                const newStartDate = startDate || currentEntry.startDate;
                const newEndDate = endDate || currentEntry.endDate;
                const newResourceId = resourceId || currentEntry.resourceId;

                // Vérifier les conflits (exclure la réservation actuelle)
                const conflicts = await prisma.entry.findMany({
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

            const entry = await prisma.entry.update({
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
                await prisma.resource.update({
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
        const entry = await prisma.entry.findUnique({
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

        const resourceId = entry.resourceId;

        // Supprimer la réservation
        await prisma.entry.delete({
            where: {
                id: parseInt(id)
            }
        });

        // Mettre à jour le statut de la ressource après suppression
        if (resourceId) {
            // Si on supprime une réservation, la ressource redevient automatiquement disponible
            await prisma.resource.update({
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