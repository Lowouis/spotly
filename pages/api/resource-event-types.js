import db from '@/server/services/databaseService';
import {runMiddleware} from '@/services/server/core';
import {requireAdmin, requireAuth} from '@/services/server/api-auth';

const DEFAULT_EVENT_TYPES = [
    {name: 'Casse', icon: 'CircleAlert'},
    {name: 'Réparation', icon: 'TriangleAlert'},
    {name: 'Maintenance', icon: 'Wrench'},
    {name: 'Contrôle', icon: 'ClipboardCheck'},
    {name: 'Nettoyage', icon: 'Sparkles'},
    {name: 'Incident signalé', icon: 'CircleAlert'},
];

async function ensureDefaultTypes() {
    await Promise.all(DEFAULT_EVENT_TYPES.map((type) => db.resourceEventType.upsert({
        where: {name: type.name},
        update: {},
        create: type,
    })));
}

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method === 'OPTIONS') return res.status(200).json({message: 'OK'});
    if (!['GET', 'POST'].includes(req.method)) {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const session = req.method === 'POST' ? await requireAdmin(req, res) : await requireAuth(req, res);
    if (!session) return;

    if (req.method === 'GET') {
        await ensureDefaultTypes();
        const types = await db.resourceEventType.findMany({orderBy: {name: 'asc'}});
        return res.status(200).json(types);
    }

    const name = String(req.body?.name || '').trim();
    const icon = String(req.body?.icon || 'Wrench').trim();
    if (!name) return res.status(400).json({message: 'Le nom est obligatoire'});

    const type = await db.resourceEventType.upsert({
        where: {name},
        update: {icon},
        create: {name, icon},
    });
    return res.status(200).json(type);
}
