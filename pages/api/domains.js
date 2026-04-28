'use server';
import db from "@/server/services/databaseService";
import {runMiddleware} from "@/services/server/core";
import {NextResponse} from 'next/server';
import {requireAdmin} from '@/services/server/api-auth';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method !== 'GET' && req.method !== 'OPTIONS' && !await requireAdmin(req, res)) return;
    if(req.method === "GET"){
        const domains = await db.domain.findMany({
            include: {
                owner: true,
                pickable: true
            }
        });
        res.status(200).json(domains);
    } else if (req.method === "POST"){
        const {name, owner, pickable} = req.body;

        const domain = await db.domain.create({
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
        console.log("PUT", {id, name, owner, pickable});
        if (owner === undefined) {
            const resources = await db.resource.findMany({
                where: {
                    domainId: id,
                    moderate: true,
                    owner: null,
                    category: {
                        owner: null
                    }
                },
                include: {
                    category: {include: {owner: true}},
                    owner: true
                }
            });
            if (resources.length !== 0) {
                return res.status(422).json({
                    code: "MODERATED_RESOURCES_WITH_OWNER",
                    message: "Impossible de supprimer le propriétaire, il existe encore des ressources modérer liée à ce domaine.",
                    resources: resources
                });
            }
        }
        const domain = await db.domain.update({
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
            const domains = await db.domain.deleteMany({
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
    } else if (req.method === "OPTIONS") {
        // Gérer la requête preflight OPTIONS
        const response = NextResponse.next();
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']); // S'assurer que OPTIONS est listé
        res.writeHead(204, Object.fromEntries(response.headers.entries()));
        res.end();
    } else {
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
}
