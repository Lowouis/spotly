import {runMiddleware} from "@/services/server/core";
import db from "@/server/services/databaseService";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method === "GET") {
        const pickables = await db.pickable.findMany();
        res.status(200).json(pickables);
    } else if (req.method === "PUT") {
        const {id, name, distinguishedName, description, cgu} = req.body;

        if (!id || !name || !distinguishedName || !description || !cgu) {
            return res.status(400).json({message: "Missing required fields"});
        }

        const pickable = await db.pickable.update({
            where: {id},
            data: {name, distinguishedName, description, cgu},
        });

        res.status(200).json(pickable);
    } else {
        res.status(405).json({message: "Method not allowed"});
    }
}
