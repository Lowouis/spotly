import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";
import {NextResponse} from 'next/server';

export default async function handler(req, res) {

    await runMiddleware(req, res);

    const { id } = req.query;

    if (req.method === "PUT") {
        try {
            const {moderate, returned, adminNote} = req.body;

            const entry = await prisma.entry.update({
                where: {
                    id: parseInt(id)
                },
                data: {
                    ...(moderate && { moderate }),
                    ...(adminNote && {adminNote}),
                    ...(returned && {
                        returned: returned,
                        endDate: new Date()
                    })
                },
                include: {
                    resource: true
                }
            });

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