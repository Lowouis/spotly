import db from '@/server/services/databaseService';
import {runMiddleware} from '@/services/server/core';
import {requireAdmin} from '@/services/server/api-auth';
import {getAllConfigStatuses} from '@/services/server/config-status';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed'});
    }
    if (!await requireAdmin(req, res)) return;

    try {
        const statuses = await getAllConfigStatuses(db);
        return res.status(200).json(statuses);
    } catch (error) {
        console.error('Config statuses fetch error:', error);
        return res.status(500).json({
            message: 'Erreur lors de la récupération des statuts',
            details: process.env.NODE_ENV === 'development' ? error.message : null,
        });
    }
}
