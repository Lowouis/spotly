'use server';
import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if(req.method === "GET"){
        const domains = await prisma.domain.findMany({
            include: {
                owner: true,
                pickable: true
            }
        });
        res.status(200).json(domains);
    } else if (req.method === "POST"){
        const {name, owner, pickable} = req.body;

        const domain = await prisma.domain.create({
            data: {
                name,
                pickable: pickable?.id ? {
                    connect: {id: pickable.id}
                } : undefined,
                owner: owner?.id ? {
                    connect: {id: owner.id}
                } : undefined
            }
        });
        res.status(200).json(domain);
    } else if (req.method === "PUT") {
        const {id, name, owner, pickable} = req.body;
        const domain = await prisma.domain.update({
            where: {
                id: id,
            },
            data: {
                name,
                pickable: pickable?.id ? {
                    connect: {id: pickable.id}
                } : {
                    disconnect: true
                },
                owner: owner?.id ? {
                    connect: {id: owner.id}
                } : {
                    disconnect: true
                }
            }
        });
        res.status(200).json(domain);
    } else if (req.method === "DELETE") {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid or missing 'ids' in request body" });
        }

        try {
            const domains = await prisma.domain.deleteMany({
                where: {
                    id: {
                        in: ids,
                    },
                },
            });

            if (domains.count === 0) {
                return res.status(404).json({ message: "No domains found to delete" });
            }

            res.status(200).json({message: "Domains deleted successfully", count: domains.count});
        } catch (error) {
            console.error("Error deleting domains:", error);
            res.status(500).json({ message: "Failed to delete domains" });
        }
    } else {
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
}