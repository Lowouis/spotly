import {runMiddleware} from "@/lib/core";
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
    await runMiddleware(req, res);

    const {ip} = req.query;

    if (!ip) {
        return res.status(400).json({error: 'IP address is required'});
    }

    try {
        const authorizedLocation = await prisma.authorizedLocation.findFirst({
            where: {
                ip: ip,
            }
        });

        if (!authorizedLocation) {
            return res.status(401).json({error: 'IP not authorized'});
        }

        return res.status(200).json(authorizedLocation);
    } catch (error) {
        console.error('Error checking authorized location:', error);
        return res.status(500).json({error: 'Internal server error'});
    }
}