'use server';
import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {

    await runMiddleware(req, res);

    if(req.method === "GET"){
        const timeScheduleOptions = await prisma.timeScheduleOptions.findMany();
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
        const delayedResourcesTotal = await prisma.entry.count(
            {
                where: {
                    moderate: "USED",
                    endDate: {
                        lt: new Date(new Date().getTime() + timeScheduleOptions[0].onReturn * 60000)
                    }
                }
            }
        )
        const ratio = Math.floor(100 - (bookedResourcesTotal * 100) / availableResourcesTotal);
        const test = await prisma.domain.findMany();
        res.status(200).json({
            usersTotal,
            entriesTotal,
            availableResourcesTotal,
            bookedResourcesTotal,
            delayedResourcesTotal,
            ratio,
            test
        });
    }

}