'use server';
import prisma from "@/prismaconf/init";


export default async function handler(req, res) {
    try {
        if(req.method === "GET"){
            const { userId, startDate, endDate, siteId, categoryId, resourceId, moderate, otherParams } = req.query;
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

                        ...(startDate  && {
                            startDate: {
                                lte: endDate
                            },
                        }),
                        ...( endDate && {
                            endDate: {
                                gte: startDate
                            }
                        }),



                },
               include: { user: true ,resource: { include: { domains : true } } }
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
        } else if(req.method === "PUT") {
            const { id } = req.query;
            const { moderate } = req.body;
            console.log("Updating entry with id:", id); // Log the id

            const entry = await prisma.entry.update({
                where: {
                    id: parseInt(id)
                },
                data: {
                    moderate: moderate
                }
            });

            res.status(200).json(entry);
        } else if(req.method === "DELETE"){
            const { id } = req.query;
            console.log("Deleting entry with id:", id); // Log the id

            const entry = await prisma.entry.delete({
                where: {
                    id: parseInt(id)
                }
            });

            res.status(200).json(entry);
        }



    } catch (error) {
        console.error("Failed to parse JSON:");
        res.status(500).json({error: "Failed to parse JSON"});
    }
}