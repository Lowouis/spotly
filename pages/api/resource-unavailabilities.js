import db from '@/server/services/databaseService';
import {runMiddleware} from '@/services/server/core';
import {requireAdmin} from '@/services/server/api-auth';

const ALLOWED_TYPES = new Set(['MAINTENANCE', 'ADMIN_BLOCK', 'INTERNAL_USE', 'EVENT', 'INVENTORY', 'OTHER']);

const parseDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeResourceIds = (body) => {
    const rawIds = Array.isArray(body.resourceIds) ? body.resourceIds : [body.resourceId];
    return [...new Set(rawIds.map((id) => Number(id)).filter(Number.isInteger))];
};

const normalizeOccurrences = (body) => {
    const source = Array.isArray(body.occurrences) && body.occurrences.length
        ? body.occurrences
        : [{startDate: body.startDate, endDate: body.endDate}];

    return source.map((occurrence) => {
        const startDate = parseDate(occurrence.startDate || occurrence.start);
        const endDate = parseDate(occurrence.endDate || occurrence.end);
        return {startDate, endDate};
    }).filter(({startDate, endDate}) => startDate && endDate && startDate < endDate);
};

const getNextRecurringGroupId = async () => {
    const result = await db.resourceUnavailability.aggregate({
        _max: {recurringGroupId: true},
    });
    return (result._max.recurringGroupId || 0) + 1;
};

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const session = await requireAdmin(req, res);
    if (!session) return;

    if (req.method === 'GET') {
        const {resourceId, from, to} = req.query;
        const fromDate = from ? parseDate(from) : null;
        const toDate = to ? parseDate(to) : null;

        const items = await db.resourceUnavailability.findMany({
            where: {
                ...(resourceId && {resourceId: Number(resourceId)}),
                ...(fromDate && toDate && {
                    startDate: {lte: toDate},
                    endDate: {gte: fromDate},
                }),
            },
            include: {
                resource: {include: {domains: true, category: true}},
                createdBy: {select: {id: true, name: true, surname: true, email: true}},
            },
            orderBy: {startDate: 'asc'},
        });

        return res.status(200).json(items);
    }

    if (req.method === 'POST') {
        const resourceIds = normalizeResourceIds(req.body);
        const occurrences = normalizeOccurrences(req.body);
        const type = ALLOWED_TYPES.has(req.body.type) ? req.body.type : 'ADMIN_BLOCK';
        const reason = typeof req.body.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim() : null;
        const visibleToUsers = Boolean(req.body.visibleToUsers);

        if (!resourceIds.length || !occurrences.length) {
            return res.status(400).json({message: 'Ressource(s) ou créneau(x) invalides'});
        }

        const isRecurring = occurrences.length > 1;
        const firstRecurringGroupId = isRecurring ? await getNextRecurringGroupId() : 0;
        const recurringGroupIds = isRecurring ? resourceIds.map((_, index) => firstRecurringGroupId + index) : [];
        const data = resourceIds.flatMap((resourceId, resourceIndex) => occurrences.map(({startDate, endDate}) => ({
            resourceId,
            createdById: Number(session.user.id),
            type,
            reason,
            visibleToUsers,
            startDate,
            endDate,
            recurringGroupId: isRecurring ? recurringGroupIds[resourceIndex] : 0,
        })));

        await db.resourceUnavailability.createMany({data});
        const created = await db.resourceUnavailability.findMany({
            where: isRecurring
                ? {recurringGroupId: {in: recurringGroupIds}}
                : {OR: data.map(({resourceId, startDate, endDate}) => ({resourceId, startDate, endDate}))},
            include: {resource: {include: {domains: true, category: true}}, createdBy: {select: {id: true, name: true, surname: true, email: true}}},
            orderBy: {startDate: 'asc'},
        });

        return res.status(201).json(created);
    }

    if (req.method === 'PUT') {
        const id = Number(req.body.id);
        const startDate = parseDate(req.body.startDate);
        const endDate = parseDate(req.body.endDate);
        if (!id || !startDate || !endDate || startDate >= endDate) {
            return res.status(400).json({message: 'Données invalides'});
        }

        const item = await db.resourceUnavailability.update({
            where: {id},
            data: {
                startDate,
                endDate,
                type: ALLOWED_TYPES.has(req.body.type) ? req.body.type : 'ADMIN_BLOCK',
                reason: typeof req.body.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim() : null,
                visibleToUsers: Boolean(req.body.visibleToUsers),
            },
            include: {resource: {include: {domains: true, category: true}}, createdBy: {select: {id: true, name: true, surname: true, email: true}}},
        });

        return res.status(200).json(item);
    }

    if (req.method === 'DELETE') {
        const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Number.isInteger) : [Number(req.body.id)].filter(Number.isInteger);
        if (!ids.length) return res.status(400).json({message: 'Identifiant manquant'});

        const result = await db.resourceUnavailability.deleteMany({where: {id: {in: ids}}});
        return res.status(200).json({count: result.count});
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({message: `Method ${req.method} not allowed`});
}
