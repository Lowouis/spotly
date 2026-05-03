import db from '@/server/services/databaseService';
import {runMiddleware} from '@/services/server/core';
import {requireAdmin} from '@/services/server/api-auth';
import {findAffectedReservations} from '@/services/server/resource-event-impact';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (!await requireAdmin(req, res)) return;

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({message: `Method ${req.method} not allowed`});
    }

    const resourceId = Number(req.query?.resourceId);
    const startDate = req.query?.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query?.endDate ? new Date(req.query.endDate) : null;

    if (!resourceId || !startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return res.status(400).json({message: 'resourceId, startDate et endDate sont obligatoires'});
    }
    if (endDate < startDate) {
        return res.status(400).json({message: 'La date de fin doit être postérieure à la date de début'});
    }

    const reservations = await findAffectedReservations(db, {resourceId, startDate, endDate});
    return res.status(200).json(reservations);
}
