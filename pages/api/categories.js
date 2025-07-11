'use server';
import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";
import {NextResponse} from 'next/server';

export default async function handler(req, res) {

    await runMiddleware(req, res);

    if(req.method === "GET"){
        const categories = await prisma.category.findMany(
            {
                include: {
                    owner: true,
                    pickable: true
                }
            }
        );
        res.status(200).json(categories);
    } else if (req.method === "POST"){
        const {name, description, owner, pickable } = req.body;
        const category = await prisma.category.create({
            data: {
                name,
                description,
                ownerId: owner !== null ? owner.id : null,
                pickableId: pickable !== null ? pickable.id : null
            }
        });
        res.status(200).json(category);
    } else if (req.method === "PUT") {

        const {id, name, description, owner, pickable } = req.body;
        // if owner is undefined, check if any resource with moderate to true who has this category has an owner or it domain has one
        if (owner === undefined) {
            const resources = await prisma.resource.findMany({
                where: {
                    categoryId: id,
                    moderate: true,
                    owner: null,
                    domains: {
                        owner: null
                    }
                },
                include: {
                    domains: {include: {owner: true}}
                }
            });
            if (resources.length !== 0) {
                return res.status(422).json({
                    code: "MODERATED_RESOURCES_WITH_OWNER",
                    message: "Impossible de supprimer le propriétaire, il existe encore des ressources modérer liée à cette catégorie.",
                    resources: resources
                });
            }
        }
        const category = await prisma.category.update({
            where: {
                id: id,
            },
            data: {
                name,
                ...(description ? {
                    description
                } : { description : null }),
                ownerId: owner !== undefined && owner !== null ? owner.id : null,
                pickableId: pickable !== undefined && pickable !== null ? pickable.id : null
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
    } else if (req.method === "OPTIONS") {
        // Gérer la requête preflight OPTIONS
        // Le middleware ajoute déjà les en-têtes CORS nécessaires sur la réponse
        const response = NextResponse.next();
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']); // S'assurer que OPTIONS est listé
        res.writeHead(204, Object.fromEntries(response.headers.entries()));
        res.end();
    } else {
        // Méthodes non autorisées autres que OPTIONS
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE", "OPTIONS"]);
        res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
}