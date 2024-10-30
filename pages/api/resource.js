'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    const {id, otherParams } = req.query;

        const resources = await prisma.resource.findUnique({
            where: {
                id : id,
            }
        });

        return res.status(200).json(resources);

}