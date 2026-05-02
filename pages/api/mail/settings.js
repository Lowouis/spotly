import db from '@/server/services/databaseService';
import {EMAIL_TEMPLATE_NAMES} from '@/config/emailTemplates';
import {runMiddleware} from '@/services/server/core';
import {requireAdmin} from '@/services/server/api-auth';
import {getEmailTemplateSettings} from '@/services/server/mails/settings';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const session = await requireAdmin(req, res);
    if (!session) return;

    if (req.method === 'GET') {
        try {
            const settings = await getEmailTemplateSettings(db);
            return res.status(200).json({settings});
        } catch (error) {
            console.error('Email settings fetch error:', error);
            return res.status(500).json({message: 'Erreur lors de la récupération de la configuration mail'});
        }
    }

    if (req.method === 'PUT') {
        try {
            const settings = req.body?.settings || {};
            const updates = Object.entries(settings).filter(([templateName]) => EMAIL_TEMPLATE_NAMES.includes(templateName));

            await db.$transaction(
                updates.map(([templateName, enabled]) => db.emailTemplateSetting.upsert({
                    where: {templateName},
                    create: {templateName, enabled: Boolean(enabled)},
                    update: {enabled: Boolean(enabled)},
                }))
            );

            const nextSettings = await getEmailTemplateSettings(db);
            return res.status(200).json({settings: nextSettings});
        } catch (error) {
            console.error('Email settings save error:', error);
            return res.status(500).json({message: 'Erreur lors de la sauvegarde de la configuration mail'});
        }
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({message: `Method ${req.method} not allowed`});
}
