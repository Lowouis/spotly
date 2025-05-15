'use server';
import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";


export default async function handler(req, res) {
    await runMiddleware(req, res);
    try {
        if(req.method === "GET"){
            const {
                userId,
                startDate,
                endDate,
                siteId,
                categoryId,
                resourceId,
                moderate,
                returnedConfirmationCode,
                owned,
            } = req.query;
            const entries = await prisma.entry.findMany({
                orderBy : {
                    startDate: "asc"
                },
                where: {
                    ...(moderate && {moderate : moderate}),
                    ...(userId && {userId : parseInt(userId)}),
                    ...(resourceId && {
                        resourceId: parseInt(resourceId)
                    }),
                    ...(returnedConfirmationCode && {returnedConfirmationCode : returnedConfirmationCode}),
                    ...(siteId && categoryId && {
                        resource : {
                            ... (resourceId!=null ? {
                                id: parseInt(resourceId)
                            } : {
                                domains : {
                                    id: parseInt(siteId)
                                },
                                categoryId: parseInt(categoryId),
                            })
                        },


                    }),
                    ...(startDate && {
                        startDate: {
                            lte: endDate
                        },
                    }),
                    ...(endDate && {
                        endDate: {
                            gte: startDate
                        }
                    }),
                    ...(owned && {
                        resource: {
                            OR: [
                                {ownerId: parseInt(owned)},
                                {category: {ownerId: parseInt(owned)}},
                                {domains: {ownerId: parseInt(owned)}},
                            ]
                        }
                    }),
                },
               include: {
                    user : true,

                   resource : {
                        include : {
                            domains: {include: {owner: true, pickable: true}},
                            category: {include: {owner: true, pickable: true}},
                            owner: true,
                            pickable: true,
                        }
                    }
               }
            });
            console.log(entries);

            res.status(200).json(entries);
        } else if (req.method === "POST") {
            const {
                userId,
                resourceId,
                key,
                moderate,
                comment,
                availabilities,
                system
            } = req.body;

            // Validation des données requises
            if (!userId || !resourceId || !availabilities || !Array.isArray(availabilities)) {
                return res.status(400).json({
                    error: "Données invalides",
                    details: "userId, resourceId et availabilities (tableau) sont requis"
                });
            }

            // Validation des IDs
            const parsedUserId = parseInt(userId);
            const parsedResourceId = parseInt(resourceId);
            if (isNaN(parsedUserId) || isNaN(parsedResourceId)) {
                return res.status(400).json({
                    error: "Données invalides",
                    details: "userId et resourceId doivent être des nombres valides"
                });
            }

            // Validation des dates et filtrage des disponibilités
            const validAvailabilities = availabilities.filter(entry => {
                if (!entry.available) return false;

                const start = new Date(entry.start);
                const end = new Date(entry.end);

                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    console.warn("Date invalide ignorée:", entry);
                    return false;
                }

                if (start >= end) {
                    console.warn("Date de début après date de fin ignorée:", entry);
                    return false;
                }

                return true;
            });

            if (validAvailabilities.length === 0) {
                return res.status(400).json({
                    error: "Données invalides",
                    details: "Aucune disponibilité valide trouvée"
                });
            }

            const newEntries = [];

            const maxReccurringGroupId = await prisma.entry.groupBy({
                by: ['recurringGroupId'],
                _max: {
                    recurringGroupId: true,
                },
            });

            const nextReccurringGroupId = maxReccurringGroupId.length > 0
                ? (maxReccurringGroupId[0]._max.recurringGroupId || 0) + 1
                : 1;


            try {
                for (const availabilityEntry of validAvailabilities) {
                    const entry = await prisma.entry.create({
                        data: {
                            startDate: new Date(availabilityEntry.start),
                            endDate: new Date(availabilityEntry.end),
                            user: {
                                connect: {
                                    id: parsedUserId
                                }
                            },
                            resource: {
                                connect: {
                                    id: parsedResourceId
                                }
                            },
                            ...(comment && {comment}),
                            ...(key && {key}),
                            moderate: moderate || "ACCEPTED",
                            ...(system && {system}),
                            recurringGroupId: validAvailabilities.length > 1 ? nextReccurringGroupId : 0,
                        },
                        include: {
                            user: true,
                            resource: {
                                include: {
                                    domains: {include: {owner: true}},
                                    category: {include: {owner: true}},
                                    owner: true
                                }
                            }
                        }
                    });
                    newEntries.push(entry);
                }

                res.status(201).json(newEntries);
            } catch (dbError) {
                console.error("Erreur base de données:", dbError);
                res.status(500).json({
                    error: "Erreur lors de la création de l'entrée",
                    details: "Erreur lors de l'écriture en base de données"
                });
            }
        } else if(req.method === "DELETE"){
            const { ids } = req.query;
            console.log(req.query);
            const entry = await prisma.entry.deleteMany({
                where: {
                    id: {
                        in: ids
                    }
                }
            });

            res.status(200).json(entry);
        }
    } catch (error) {
        console.error("Erreur lors de la création de l'entrée:", error);
        res.status(500).json({
            error: "Erreur lors de la création de l'entrée",
            details: error.message
        });
    }

}