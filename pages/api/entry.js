'use server';
import prisma from "@/prismaconf/init";


export default async function handler(req, res) {
    try {
        if(req.method === "GET"){
            const { userId, startDate, endDate, siteId, categoryId, resourceId, otherParams } = req.query;

            const entries = await prisma.entry.findMany({
                where: {
                    ...(userId && {userId : userId}),
                    ...(resourceId && {
                        resourceId: resourceId
                    }),
                    ...(siteId && categoryId && {
                        resource : {
                            ... (resourceId ? {
                                id: resourceId
                            } : {
                                domains : {
                                    id: siteId
                                },
                                categoryId: categoryId,
                            })
                        },


                    }),
                    ...(startDate  && {
                        startDate: {
                            gte: startDate
                        },
                    }),
                    ...( endDate && {
                        endDate: {
                            lte: endDate
                        }
                    }),

                },
                include: { resource: { include: { domains : true } } }
            });
            res.status(200).json(entries);
        } else if (req.method === "POST") {

            const { userId,
                    startDate,
                    endDate,
                    category,
                    site,
                    description,
                    resourceId,
                    key } = req.body;



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
                    description: description,
                    key: key
                }
            });
            res.status(201).json(entry);
        }



    } catch (error) {
        console.error("Failed to parse JSON:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}