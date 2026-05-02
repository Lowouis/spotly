import db from '@/server/services/databaseService';
import {runMiddleware} from '@/services/server/core';
import {rateLimit} from '@/services/server/api-auth';
import {canUseExternalCode, requiresLocationCheck} from '@/services/server/entry-control';
import {getAuthorizedLocationForRequest} from '@/services/server/client-ip';
import {canPickupEntryNow} from '@/services/server/pickup-availability';

const entryInclude = {
    user: true,
    resource: {
        include: {
            domains: {include: {pickable: true}},
            category: {include: {pickable: true}},
            pickable: true,
        },
    },
};

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({message: `Method ${req.method} not allowed`});
    }

    if (!rateLimit(req, res, {key: 'entry-code-action', limit: 10, windowMs: 60_000})) return;

    const code = String(req.body?.code || '').trim();
    const action = String(req.body?.action || '').trim();
    if (!/^\d{6}$/.test(code) || !['pickup', 'return'].includes(action)) {
        return res.status(400).json({message: 'Code ou action invalide'});
    }

    const entry = await db.entry.findFirst({
        where: {returnedConfirmationCode: code},
        include: entryInclude,
    });
    if (!entry || !canUseExternalCode(entry)) {
        return res.status(404).json({message: 'Réservation introuvable'});
    }

    if (requiresLocationCheck(entry)) {
        const {authorizedLocation} = await getAuthorizedLocationForRequest(req);
        if (!authorizedLocation) {
            return res.status(403).json({message: 'Appareil non autorisé'});
        }
    }

    const now = new Date();
    if (action === 'pickup') {
        const pickupAvailability = await canPickupEntryNow(db, entry, now);
        if (!pickupAvailability.allowed) {
            return res.status(409).json({message: pickupAvailability.reason});
        }

        const updatedEntry = await db.entry.update({
            where: {id: entry.id},
            data: {moderate: 'USED', lastUpdatedModerateStatus: now},
            include: entryInclude,
        });
        await db.resource.update({where: {id: entry.resourceId}, data: {status: 'UNAVAILABLE'}});
        return res.status(200).json(updatedEntry);
    }

    if (entry.moderate !== 'USED') {
        return res.status(409).json({message: 'La restitution n’est pas disponible'});
    }

    const updatedEntry = await db.entry.update({
        where: {id: entry.id},
        data: {moderate: 'ENDED', returned: true, endDate: now, lastUpdatedModerateStatus: now},
        include: entryInclude,
    });
    await db.resource.update({where: {id: entry.resourceId}, data: {status: 'AVAILABLE'}});
    return res.status(200).json(updatedEntry);
}
