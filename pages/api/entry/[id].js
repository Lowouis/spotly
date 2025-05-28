import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";
import {NextResponse} from 'next/server';

export default async function handler(req, res) {

    await runMiddleware(req, res);

    const { id } = req.query;

    if (req.method === "PUT") {
        try {
            const {moderate, returned, adminNote} = req.body;

            const entry = await prisma.entry.update({
                where: {
                    id: parseInt(id)
                },
                data: {
                    ...(moderate && { moderate }),
                    ...(adminNote && {adminNote}),
                    ...(returned && {
                        returned: returned,
                        endDate: new Date()
                    })
                },
                include: {
                    resource: true
                }
            });

            if (moderate === "USED" || moderate === "ENDED") {
                await prisma.resource.update({
                    where: {
                        id: entry.resource.id
                    },
                    data: {
                        status: moderate === "USED" ? "UNAVAILABLE" : "AVAILABLE"
                    }
                });
            }
            
            return res.status(200).json(entry);
        } catch (error) {
            console.error("Failed to update entry:", error);
            return res.status(500).json({error: "Failed to update entry"});
        }
    } else if(req.method === "DELETE"){
        const { id } = req.query;
        const entry = await prisma.entry.delete({
            where: {
                id: parseInt(id)
            }
        });

        res.status(200).json(entry);
    } else if (req.method === "OPTIONS") {
        // Gérer la requête preflight OPTIONS
        const response = NextResponse.next();
        res.setHeader('Allow', ['PUT', 'DELETE', 'OPTIONS']);
        res.writeHead(204, Object.fromEntries(response.headers.entries()));
        res.end();
    } else {
        return res.status(405).json({message: "Method not allowed"});
    }
}