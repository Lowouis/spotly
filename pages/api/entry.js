'use server';
import prisma from "@/prismaconf/init";


export default async function handler(req, res) {
    try {
        const { userId, startDate, endDate, siteId, categoryId, resourceId, otherParams } = req.query;
        const entries = await prisma.entry.findMany({
            where: {
                userId: userId && userId,
                ...(siteId && categoryId && {
                    resource : {
                        domains : {
                            id: siteId
                        },
                        categoryId: categoryId,
                        ...(resourceId && {
                            id: resourceId
                        })
                    }

                }),
                ...(startDate && endDate && {
                    startDate: {
                        gte: new Date(startDate)
                    },
                    endDate: {
                        lte: new Date(endDate)
                    }
                }),

            },
            include: { resource: { include: { domains : true } } }
        });

        res.status(200).json(entries);
    } catch (error) {
        console.error("Failed to parse JSON:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}