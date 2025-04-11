'use server';
import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method === "DELETE"){
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid or missing 'ids' in request body" });
        }

        try {
            const resourcesCategories = await prisma.resource.deleteMany({
                where: {
                    id: {
                        in: ids,
                    },
                },
            });

            if (resourcesCategories.count === 0) {
                return res.status(404).json({ message: "No domains found to delete" });
            }

            res.status(200).json({ message: "Categories deleted successfully", count: resourcesCategories.count });
        } catch (error) {
            console.error("Error deleting domains:", error);
            res.status(500).json({ message: "Failed to delete domains" });
        }
    } else if(req.method === "GET"){

        const {categoryId, domainId, status} = req.query;

        const resources = await prisma.resource.findMany({
            where: {
                ...(categoryId && {categoryId : parseInt(categoryId)}),
                ...(domainId && {domainId : parseInt(domainId)}),
                ...(status && {status : status}),
            },
            include: {
                domains: {
                    include: {
                        owner: true,
                        pickable: true
                    }
                },
                category: {
                    include: {
                        owner: true,
                        pickable: true
                    }
                },
                owner: true,
                pickable: true
            }
        });
        const sanitizedResources = resources.map(({ domainId, categoryId, ...rest }) => rest);

        return res.status(200).json(sanitizedResources);
    } else if(req.method === "POST"){
        const {name, description, moderate, domains, category, owner, pickable } = req.body;
        console.log(req.body);
        const ressource = await prisma.resource.create({
            data : {
                name : name,
                description : description,
                moderate : moderate === "1",
                ...(pickable?.id && {
                    pickable: {
                        connect: {id: pickable.id}
                    }
                }),
                domains : {
                    connect : { id : domains.id }
                },
                ...( owner?.id && {
                    owner: {
                        connect: {id: owner.id}
                    }
                }),
                category : {
                    connect : {
                        id : category.id
                    }},
            }})
        return res.status(200).json(ressource);
    } else if (req.method === "PUT") {
        const {id, name, description, moderate, domains, category, owner, pickable } = req.body;
        const ressource = await prisma.resource.update({
            where: {
                id: id,
            },
            data: {
                name,
                moderate: moderate === "1",
                ...(pickable !== null && pickable !== undefined ? {
                    pickable: {
                        connect: {id: pickable.id}
                    }
                } : {
                    pickable: {
                        disconnect: true
                    }
                }),
                domains : {
                    connect : { id : domains.id }
                },
                ...(owner !== null && owner !== undefined ? {
                    owner: {
                        connect: {id: owner.id}
                    }
                } : {
                    owner: {
                        disconnect: true
                    }
                }),
                ...(description ? {
                    description
                } : { description : null }),
                category : {
                    connect : {
                        id : category.id
                    }},
            }
        });
        return res.status(200).json(ressource);
    }

}