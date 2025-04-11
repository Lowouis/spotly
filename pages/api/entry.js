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

            res.status(200).json(entries);
        } else if (req.method === "POST") {

            const { userId,
                    startDate,
                    endDate,
                    resourceId,
                    key,
                    moderate,
                    comment
            } = req.body;

            const entry = await prisma.entry.create({
                data: {
                    startDate: startDate,
                    endDate: endDate,
                    user : {
                        connect : {
                            id : userId
                        }
                    },
                    resource : {
                        connect : {
                            id : resourceId
                        }
                    },
                    ...(comment !== "" && comment !== null && {comment: comment}),
                    key: key,
                    moderate: moderate
                },
                include : {
                    user : true,
                    resource : {
                        include: {
                            domains: {include: {owner: true}},
                            category: {include: {owner: true}},
                            owner: true
                        }
                    }
                }
            });
            res.status(201).json(entry);
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
        console.error("Failed to parse JSON:");
        res.status(500).json({error: "Failed to parse JSON"});
    }

}