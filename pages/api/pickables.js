import {runMiddleware} from "@/lib/core";
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method === "GET") {
        const pickables = await prisma.pickable.findMany();
        res.status(200).json(pickables);
    } else {
        res.status(405).json({message: "Method not allowed"});
    }
}