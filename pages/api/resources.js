'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    const {categoryId, domainId, status} = req.query;

        const resources = await prisma.resource.findMany({
            where: {
                ...(categoryId && {categoryId : parseInt(categoryId)}),
                ...(domainId && {domainId : parseInt(domainId)}),
                ...(status && {status : status}),
            },
            include: { domains : true, category : true }
        });
        const sanitizedResources = resources.map(({ domainId, categoryId, ...rest }) => rest);


        return res.status(200).json(sanitizedResources);

}