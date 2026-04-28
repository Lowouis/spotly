'use server';
import db from "@/server/services/databaseService";
import {runMiddleware} from "@/services/server/core";

export default async function handler(req, res) {

    await runMiddleware(req, res);

    if(req.method === "GET"){
        const timeScheduleOptions = await db.timeScheduleOptions.findMany();
        const usersTotal = await db.user.count();
        const entriesTotal = await db.entry.count();
        const availableResourcesTotal = await db.resource.count(
            {
                where: {
                    status: "AVAILABLE"
                }
            }
        );
        const bookedResourcesTotal = await db.entry.count(
            {
                where : {
                    moderate : "USED"
                }
            }
        )
        const delayedResourcesTotal = await db.entry.count(
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
        const test = await db.domain.findMany();
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