import db from "@/server/services/databaseService";
import {runMiddleware} from "@/services/server/core";
import {requireAuth} from "@/services/server/api-auth";
import {NextResponse} from "next/server";

const serializeFavorites = (favorites) => ({
    sites: favorites
        .filter((favorite) => favorite.type === "SITE" && favorite.domain)
        .slice(0, 1)
        .map((favorite) => ({
            id: favorite.domain.id,
            name: favorite.domain.name,
            resourceCount: favorite.domain._count?.resource || 0,
        })),
    resources: favorites
        .filter((favorite) => favorite.type === "RESOURCE" && favorite.resource)
        .map((favorite) => ({
            id: favorite.resource.id,
            name: favorite.resource.name,
            domains: favorite.resource.domains
                ? {id: favorite.resource.domains.id, name: favorite.resource.domains.name}
                : null,
            category: favorite.resource.category
                ? {id: favorite.resource.category.id, name: favorite.resource.category.name, iconKey: favorite.resource.category.iconKey, iconSvg: favorite.resource.category.iconSvg}
                : null,
        })),
});

const getUserFavorites = (userId) => db.favorite.findMany({
    where: {userId},
    orderBy: {createdAt: "asc"},
    include: {
        domain: {
            include: {
                _count: {select: {resource: true}},
            },
        },
        resource: {
            include: {
                domains: true,
                category: true,
            },
        },
    },
});

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method === "OPTIONS") {
        const response = NextResponse.next();
        res.setHeader("Allow", ["GET", "POST", "DELETE", "OPTIONS"]);
        res.writeHead(204, Object.fromEntries(response.headers.entries()));
        res.end();
        return;
    }

    const session = await requireAuth(req, res);
    if (!session) return;

    const userId = Number(session.user.id);

    if (req.method === "GET") {
        const favorites = await getUserFavorites(userId);
        return res.status(200).json(serializeFavorites(favorites));
    }

    if (req.method === "POST") {
        const {type, itemId} = req.body || {};
        const favoriteType = type === "sites" || type === "SITE" ? "SITE" : type === "resources" || type === "RESOURCE" ? "RESOURCE" : null;
        const parsedItemId = Number(itemId);

        if (!favoriteType || !Number.isInteger(parsedItemId)) {
            return res.status(400).json({message: "type et itemId sont requis"});
        }

        if (favoriteType === "SITE") {
            await db.favorite.deleteMany({
                where: {
                    userId,
                    type: "SITE",
                    domainId: {not: parsedItemId},
                },
            });

            await db.favorite.upsert({
                where: {
                    userId_type_domainId: {
                        userId,
                        type: "SITE",
                        domainId: parsedItemId,
                    },
                },
                update: {},
                create: {
                    userId,
                    type: "SITE",
                    domainId: parsedItemId,
                },
            });
        } else {
            await db.favorite.upsert({
                where: {
                    userId_type_resourceId: {
                        userId,
                        type: "RESOURCE",
                        resourceId: parsedItemId,
                    },
                },
                update: {},
                create: {
                    userId,
                    type: "RESOURCE",
                    resourceId: parsedItemId,
                },
            });
        }

        const favorites = await getUserFavorites(userId);
        return res.status(200).json(serializeFavorites(favorites));
    }

    if (req.method === "DELETE") {
        const {type, itemId} = req.body || {};
        const favoriteType = type === "sites" || type === "SITE" ? "SITE" : type === "resources" || type === "RESOURCE" ? "RESOURCE" : null;
        const parsedItemId = Number(itemId);

        if (!favoriteType || !Number.isInteger(parsedItemId)) {
            return res.status(400).json({message: "type et itemId sont requis"});
        }

        await db.favorite.deleteMany({
            where: {
                userId,
                type: favoriteType,
                ...(favoriteType === "SITE" ? {domainId: parsedItemId} : {resourceId: parsedItemId}),
            },
        });

        const favorites = await getUserFavorites(userId);
        return res.status(200).json(serializeFavorites(favorites));
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE", "OPTIONS"]);
    return res.status(405).json({message: `Method ${req.method} not allowed`});
}
