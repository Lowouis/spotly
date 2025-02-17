'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {


    if(req.method === "GET"){
        const categories = await prisma.category.findMany(
            {
                include: {
                    owner: true,
                }
            }
        );
        res.status(200).json(categories);
    } else if (req.method === "POST"){
        const {name, description, comment, owner, pickable } = req.body;
        const category = await prisma.category.create({
            data: {
                name,
                description,
                comment,
                pickable: pickable.key,
                owner: {
                    connect: { id: owner.id }
                }
            }
        });
        res.status(200).json(category);
    } else if (req.method === "DELETE") {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid or missing 'ids' in request body" });
        }

        try {
            const deletedCategories = await prisma.category.deleteMany({
                where: {
                    id: {
                        in: ids,
                    },
                },
            });

            if (deletedCategories.count === 0) {
                return res.status(404).json({ message: "No categories found to delete" });
            }

            res.status(200).json({ message: "Categories deleted successfully", count: deletedCategories.count });
        } catch (error) {
            console.error("Error deleting categories:", error);
            res.status(500).json({ message: "Failed to delete categories" });
        }
    } else {
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
}