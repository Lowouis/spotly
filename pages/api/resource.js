'use server';
import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if(req.method === "GET"){
        const {id } = req.query;
        const resources = await prisma.resource.findUnique({
            where: {
                id : id,
            }
        });
        return res.status(200).json(resources);
    }
}