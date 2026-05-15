import db from '@/server/services/databaseService';
import {runMiddleware} from '@/services/server/core';
import {requireAdmin} from '@/services/server/api-auth';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const session = await requireAdmin(req, res);
    if (!session) return;

    const groupId = Number(req.query.groupId);
    if (!groupId) return res.status(400).json({message: 'Groupe invalide'});

    if (req.method === 'DELETE') {
        const result = await db.resourceUnavailability.deleteMany({where: {recurringGroupId: groupId}});
        return res.status(200).json({count: result.count});
    }

    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({message: `Method ${req.method} not allowed`});
}
