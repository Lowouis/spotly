import {runMiddleware} from "@/services/server/core";
import db from "@/server/services/databaseService";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method === "GET") {
        const pickables = await db.pickable.findMany();
        res.status(200).json(pickables);
    } else {
        res.status(405).json({message: "Method not allowed"});
    }
}