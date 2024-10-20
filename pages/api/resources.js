'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    const { categoryId, domainId, otherParams } = req.query;

        const resources = await prisma.resource.findMany({
            where: {
                categoryId : categoryId,
                domainId : domainId,
            }
        });
        console.log(resources);
        return res.status(200).json(resources);

}