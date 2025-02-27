'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
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