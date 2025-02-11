'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    if(req.method === "GET"){
        const usersTotal = await prisma.user.count();
        const entriesTotal = await prisma.entry.count();
        const availableResourcesTotal = await prisma.resource.count(
            {
                where: {
                    status: "AVAILABLE"
                }
            }
        );
        const bookedResourcesTotal = await prisma.entry.count(
            {
                where : {
                    moderate : "USED"
                }
            }
        )
        const delayedResourcesTotal = await prisma.resource.count(
            {
                where : {
                    status: "ENDED",

                }
            }
        )
        const ratio = 100 - (bookedResourcesTotal * 100) / availableResourcesTotal;
        const test = await prisma.domain.findMany();
        res.status(200).json({usersTotal,entriesTotal, availableResourcesTotal,bookedResourcesTotal, delayedResourcesTotal, ratio, test});
    }

}