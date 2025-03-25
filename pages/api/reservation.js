import {runMiddleware} from "@/lib/core";
import prisma from "@/prismaconf/init";

export default async function reservation(req, res) {

    await runMiddleware(req, res);
    try {
        if (req.method === "GET") {
            const {startDate, endDate, siteId, categoryId, resourceId} = req.query;
            const timeScheduleOptions = await prisma.timeScheduleOptions.findMany({
                where: {
                    id: 1
                }
            });

            const ajustedStartDate = new Date(new Date(startDate).getTime() - timeScheduleOptions[0].onPickup * 60000);
            const ajustedEndDate = new Date(new Date(endDate).getTime() + timeScheduleOptions[0].onReturn * 60000);
            const entries = await prisma.resource.findMany({
                where: {
                    ...(resourceId && {id: parseInt(resourceId)}),
                    status: "AVAILABLE",
                    ...(siteId && categoryId && {
                        domains: {id: parseInt(siteId)},
                        category: {id: parseInt(categoryId)},
                    }),
                    OR: [
                        {
                            entry: {
                                none: {},
                            }
                        },
                        {
                            entry: {
                                none: {
                                    AND: [
                                        {
                                            OR: [
                                                {moderate: "ACCEPTED"},
                                                {moderate: "USED"},
                                                {moderate: "WAITING"}
                                            ]
                                        },
                                        {
                                            OR: [
                                                {
                                                    AND: [
                                                        {startDate: {lte: ajustedEndDate}},
                                                        {endDate: {gte: ajustedStartDate}}
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                },
                include: {
                    domains: {include: {owner: true}},
                    category: {include: {owner: true}},
                    owner: true
                }
            });

            if (entries.length === 0) {
                res.status(404).json({message: "No resources found"});
            } else {
                res.status(200).json(entries);
            }
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({error: "Not authorized"});
    }
}