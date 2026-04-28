'use server';
import db from "@/server/services/databaseService";
import {runMiddleware} from "@/services/server/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if(req.method === "GET"){
        const {id} = req.query;
        const resources = await db.resource.findUnique({
            where: {
                id : id,
            }
        });
        return res.status(200).json(resources);
    }
}