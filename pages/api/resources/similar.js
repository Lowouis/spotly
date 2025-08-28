import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method === "GET") {
        const {resourceId, startDate, endDate} = req.query;

        if (!resourceId || !startDate || !endDate) {
            return res.status(400).json({message: "Paramètres manquants"});
        }

        try {
            // Récupérer la ressource originale pour obtenir son site et sa catégorie
            const originalResource = await prisma.resource.findUnique({
                where: {id: parseInt(resourceId)},
                include: {
                    domains: true,
                    category: true
                }
            });

            if (!originalResource) {
                return res.status(404).json({message: "Ressource non trouvée"});
            }

            // Chercher une ressource similaire disponible
            // D'abord, récupérer toutes les ressources similaires
            const similarResources = await prisma.resource.findMany({
                where: {
                    id: {not: parseInt(resourceId)}, // Exclure la ressource originale
                    status: "AVAILABLE",
                    domainId: originalResource.domainId,
                    categoryId: originalResource.categoryId
                },
                include: {
                    domains: true,
                    category: true,
                    entry: {
                        where: {
                            moderate: {in: ['ACCEPTED', 'USED', 'WAITING']}
                        }
                    }
                }
            });

            // Filtrer manuellement les ressources qui ont des conflits de réservation
            const availableResources = similarResources.filter(resource => {
                // Vérifier s'il y a des réservations qui chevauchent la période demandée
                const hasConflict = resource.entry.some(entry => {
                    const entryStart = new Date(entry.startDate);
                    const entryEnd = new Date(entry.endDate);
                    const requestedStart = new Date(startDate);
                    const requestedEnd = new Date(endDate);

                    // Vérifier s'il y a un chevauchement
                    return entryStart < requestedEnd && entryEnd > requestedStart;
                });

                return !hasConflict;
            });

            // Retourner la première ressource disponible
            const similarResource = availableResources.length > 0 ? availableResources[0] : null;

            return res.status(200).json(similarResource);
        } catch (error) {
            console.error("Erreur lors de la recherche de ressource similaire:", error);
            return res.status(500).json({message: "Erreur interne du serveur", error: error.message});
        }
    } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).json({message: `Method ${req.method} not allowed`});
    }
}
