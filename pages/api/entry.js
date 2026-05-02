'use server';
import db from "@/server/services/databaseService";
import {runMiddleware} from "@/services/server/core";
import {NextResponse} from "next/server";
import {isAdminSession, isSameUser, rateLimit, requireAuth} from '@/services/server/api-auth';
import {createEntryMessage} from '@/services/server/entry-messages';


export default async function handler(req, res) {
    await runMiddleware(req, res);
    const isPublicCodeLookup = req.method === 'GET' && typeof req.query.returnedConfirmationCode === 'string' && /^\d{6}$/.test(req.query.returnedConfirmationCode);
    if (isPublicCodeLookup && !rateLimit(req, res, {key: 'entry-code-lookup', limit: 20, windowMs: 60_000})) return;
    const session = req.method === 'OPTIONS' || isPublicCodeLookup ? null : await requireAuth(req, res);
    if (req.method !== 'OPTIONS' && !session && !isPublicCodeLookup) return;
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
                future
            } = req.query;

            if (!isAdminSession(session) && userId && !isSameUser(session, userId)) {
                return res.status(403).json({message: 'Accès interdit'});
            }

            if (resourceId && future === "true") {
                // Récupérer les réservations futures d'une ressource
                const currentDate = new Date();
                const futureEntries = await db.entry.findMany({
                    where: {
                        resourceId: parseInt(resourceId),
                        ...(!isAdminSession(session) && {userId: Number(session.user.id)}),
                        startDate: {
                            gte: currentDate
                        }
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                surname: true,
                                email: true
                            }
                        },
                        resource: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        startDate: 'asc'
                    }
                });

                return res.status(200).json(futureEntries);
            }

            const entries = await db.entry.findMany({
                orderBy : {
                    startDate: "asc"
                },
                where: {
                    ...(moderate && {moderate : moderate}),
                    ...(session ? (isAdminSession(session) ? (userId && {userId : parseInt(userId)}) : {userId: Number(session.user.id)}) : {}),
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
                    ...(startDate && endDate && {
                        OR: [
                            {
                                startDate: {
                                    lte: new Date(endDate)
                                },
                                endDate: {
                                    gte: new Date(startDate)
                                }
                            }
                        ]
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
                    user: {
                        select: {
                            id: true,
                            name: true,
                            surname: true,
                            email: true,
                            role: true
                        }
                    },
                    resource: {
                        include: {
                            domains: {
                                include: {
                                    owner: true,
                                    pickable: true
                                }
                            },
                            category: {
                                include: {
                                    owner: true,
                                    pickable: true
                                }
                            },
                            owner: true,
                            pickable: true
                        }
                    },
                    _count: {
                        select: {
                            messages: true
                        }
                    }
                }
            });

            // Restructurer les données pour s'assurer que les relations sont correctement formatées
            const formattedEntries = entries.map(entry => ({
                ...entry,
                user: entry.user ? {
                    id: entry.user.id,
                    name: entry.user.name,
                    surname: entry.user.surname,
                    email: entry.user.email,
                    role: entry.user.role
                } : null,
                resource: entry.resource ? {
                    ...entry.resource,
                    domains: entry.resource.domains ? {
                        ...entry.resource.domains,
                        owner: entry.resource.domains.owner,
                        pickable: entry.resource.domains.pickable
                    } : null,
                    category: entry.resource.category ? {
                        ...entry.resource.category,
                        owner: entry.resource.category.owner,
                        pickable: entry.resource.category.pickable
                    } : null,
                    owner: entry.resource.owner,
                    pickable: entry.resource.pickable
                } : null
            }));

            res.status(200).json(formattedEntries);
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

            if (!isAdminSession(session) && !isSameUser(session, parsedUserId)) {
                return res.status(403).json({message: 'Accès interdit'});
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

            const maxReccurringGroupId = await db.entry.groupBy({
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
                    const entry = await db.entry.create({
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
                            },
                            _count: {
                                select: {
                                    messages: true
                                }
                            }
                        }
                    });

                    await createEntryMessage({
                        entryId: entry.id,
                        userId: parsedUserId,
                        content: comment,
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
            const {ids} = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    error: "Données invalides",
                    details: "Un tableau d'IDs valide est requis pour la suppression"
                });
            }

            try {
                const parsedIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));

                if (parsedIds.length === 0) {
                    return res.status(400).json({
                        error: "Données invalides",
                        details: "Aucun ID valide trouvé dans la liste fournie"
                    });
                }

                if (!isAdminSession(session)) {
                    const ownedCount = await db.entry.count({
                        where: {id: {in: parsedIds}, userId: Number(session.user.id)}
                    });
                    if (ownedCount !== parsedIds.length) {
                        return res.status(403).json({message: 'Accès interdit'});
                    }
                }

                const deletedEntries = await db.entry.deleteMany({
                    where: {
                        id: {
                            in: parsedIds
                        },
                        ...(!isAdminSession(session) && {userId: Number(session.user.id)})
                    }
                });

                res.status(200).json({
                    message: "Entrées supprimées avec succès",
                    count: deletedEntries.count
                });
            } catch (error) {
                console.error("Erreur lors de la suppression des entrées:", error);
                res.status(500).json({
                    error: "Erreur lors de la suppression des entrées",
                    details: error.message
                });
            }
        } else if (req.method === "OPTIONS") {
            // Gérer la requête preflight OPTIONS
            const response = NextResponse.next();
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
            res.writeHead(204, Object.fromEntries(response.headers.entries()));
            res.end();
        } else {
            // Méthode non autorisée
            res.setHeader("Allow", ["GET", "POST", "DELETE", "OPTIONS"]);
            res.status(405).json({message: `Method ${req.method} not allowed`});
        }
    } catch (error) {
        console.error("Erreur lors de la création de l'entrée:", error);
        res.status(500).json({
            error: "Erreur lors de la création de l'entrée",
            details: error.message
        });
    }
}
