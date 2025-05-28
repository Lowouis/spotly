import {PrismaClient} from '@prisma/client';
import {runMiddleware} from '@/lib/core';
import {NextResponse} from 'next/server';

const prisma = new PrismaClient();

export default async function handler(req, res) {

    await runMiddleware(req, res);

    switch (req.method) {
        case 'GET':
            try {
                const locations = await prisma.authorizedLocation.findMany({
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
                const location = await prisma.authorizedLocation.create({
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
                const location = await prisma.authorizedLocation.update({
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
                await prisma.authorizedLocation.deleteMany({
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