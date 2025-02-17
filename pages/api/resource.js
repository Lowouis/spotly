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
    } else if(req.method === "POST"){
        const {name, description, moderate, domains, category, ownerId, pickable } = req.body;
        const ressource = await prisma.resource.create({
        data : {
            name : name,
            description : description,
            moderate : moderate === "1",
            pickable : pickable.key,
            domains : {
                connect : {
                    id : domains.id
                }},
            owner : {
                connect : {
                    id: ownerId.id
                }},
            category : {
                connect : {
                    id : category.id
                }},
        }})
        return res.status(200).json(ressource);
    } else if (req.method === "DELETE"){
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
    }


}