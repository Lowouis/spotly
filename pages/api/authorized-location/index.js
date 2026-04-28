import db from '@/server/services/databaseService';
import {runMiddleware} from '@/services/server/core';
import {NextResponse} from 'next/server';
import {requireAdmin} from '@/services/server/api-auth';

export default async function handler(req, res) {

    await runMiddleware(req, res);
    if (req.method !== 'OPTIONS' && !await requireAdmin(req, res)) return;

    switch (req.method) {
        case 'GET':
            try {
                const locations = await db.authorizedLocation.findMany({
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                return res.status(200).json(locations);
            } catch (error) {
                return res.status(500).json({error: 'Failed to fetch authorized locations'});
            }

        case 'POST':
            try {
                const {libelle, ip} = req.body;
                const location = await db.authorizedLocation.create({
                    data: {
                        libelle,
                        ip
                    }
                });
                return res.status(201).json(location);
            } catch (error) {
                return res.status(500).json({error: 'Failed to create authorized location'});
            }

        case 'PUT':
            try {
                const {id, libelle, ip} = req.body;
                const location = await db.authorizedLocation.update({
                    where: {id: parseInt(id)},
                    data: {
                        libelle,
                        ip
                    }
                });
                return res.status(200).json(location);
            } catch (error) {
                return res.status(500).json({error: 'Failed to update authorized location'});
            }

        case 'DELETE':
            try {
                const {ids} = req.body;
                await db.authorizedLocation.deleteMany({
                    where: {
                        id: {
                            in: ids.map(id => parseInt(id))
                        }
                    }
                });
                return res.status(200).json({message: 'Locations deleted successfully'});
            } catch (error) {
                return res.status(500).json({error: 'Failed to delete authorized locations'});
            }

        case 'OPTIONS':
            // Gérer la requête preflight OPTIONS
            const response = NextResponse.next();
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
            res.writeHead(204, Object.fromEntries(response.headers.entries()));
            res.end();
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            return res.status(405).json({error: `Method ${req.method} Not Allowed`});
    }
}
