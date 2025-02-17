'use server';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    if(req.method === "GET"){
        const domains = await prisma.domain.findMany(
            {
                include: {
                    owner: true,
                }
            }
        );
        res.status(200).json(domains);
    } else if (req.method === "POST"){
        const {name, code, owner, pickable, address, street_number, country, city, zip, phone} = req.body;
        const domain = await prisma.domain.create({
            data: {
                name,
                code,
                address,
                street_number,
                country,
                city,
                zip,
                phone,
                pickable: pickable.key,
                owner: {
                    connect: { id: owner.id }
                },
            }
        });
        res.status(200).json(domain);
    } else if (req.method === "DELETE") {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid or missing 'ids' in request body" });
        }

        try {
            const domainsCategories = await prisma.domain.deleteMany({
                where: {
                    id: {
                        in: ids,
                    },
                },
            });

            if (domainsCategories.count === 0) {
                return res.status(404).json({ message: "No domains found to delete" });
            }

            res.status(200).json({ message: "Categories deleted successfully", count: domainsCategories.count });
        } catch (error) {
            console.error("Error deleting domains:", error);
            res.status(500).json({ message: "Failed to delete domains" });
        }
    } else {
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        res.status(405).json({ message: `Method ${req.method} not allowed` });
    }

}