import {runMiddleware} from '@/services/server/core';
import db from '@/server/services/databaseService';
import {NextResponse} from 'next/server';
import {requireAdmin, requireAuth} from '@/services/server/api-auth';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method === 'GET') {
        if (!await requireAuth(req, res)) return;
    } else if (req.method !== 'OPTIONS') {
        if (!await requireAdmin(req, res)) return;
    }

    switch (req.method) {
        case 'GET':
            const options = await db.timeScheduleOptions.findFirst();
            res.json(options);
            break;

        case 'PUT':
            const {onPickup, onReturn, authorizedDelay} = req.body;
            const updatedOptions = await db.timeScheduleOptions.upsert({
                where: {id: 1},
                update: {
                    onPickup: onPickup !== undefined ? onPickup : undefined,
                    onReturn: onReturn !== undefined ? onReturn : undefined,
                    authorizedDelay: authorizedDelay !== undefined ? authorizedDelay : undefined
                },
                create: {
                    onPickup: onPickup || 0,
                    onReturn: onReturn || 0,
                    authorizedDelay: authorizedDelay || 0
                },
            });
            res.json(updatedOptions);
            break;

        case 'OPTIONS':
            // Gérer la requête preflight OPTIONS
            const response = NextResponse.next();
            res.setHeader('Allow', ['GET', 'PUT', 'OPTIONS']);
            res.writeHead(204, Object.fromEntries(response.headers.entries()));
            res.end();
            break;

        default:
            res.setHeader('Allow', ['GET', 'PUT']);
            res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 
