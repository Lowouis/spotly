import {runMiddleware} from '@/services/server/core';
import db from '@/server/services/databaseService';
import {NextResponse} from 'next/server';
import {requireAdmin} from '@/services/server/api-auth';

const defaultSettings = {
    showFooter: true,
    conversationAutoDeleteDays: 7,
    conversationAutoArchiveResolvedDays: 7,
    eventDiscussionNotificationsEnabled: true,
};

const getSettings = async () => {
    const settings = await db.appSettings.findFirst();
    return settings || defaultSettings;
};

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        if (!await requireAdmin(req, res)) return;
    }

    try {
        if (req.method === 'GET') {
            const settings = await getSettings();
            res.status(200).json({...defaultSettings, ...settings});
            return;
        }

        if (req.method === 'PUT') {
            const currentSettings = await db.appSettings.findFirst();
            const {showFooter, conversationAutoDeleteDays, conversationAutoArchiveResolvedDays, eventDiscussionNotificationsEnabled} = req.body;
            const parsedConversationAutoDeleteDays = Number(conversationAutoDeleteDays);
            const parsedConversationAutoArchiveResolvedDays = Number(conversationAutoArchiveResolvedDays);
            const hasConversationAutoDeleteDays = conversationAutoDeleteDays !== undefined;
            const hasConversationAutoArchiveResolvedDays = conversationAutoArchiveResolvedDays !== undefined;

            if (hasConversationAutoDeleteDays && (!Number.isInteger(parsedConversationAutoDeleteDays) || parsedConversationAutoDeleteDays < 1 || parsedConversationAutoDeleteDays > 365)) {
                return res.status(400).json({message: 'Le délai de suppression des discussions doit être compris entre 1 et 365 jours'});
            }

            if (hasConversationAutoArchiveResolvedDays && (!Number.isInteger(parsedConversationAutoArchiveResolvedDays) || parsedConversationAutoArchiveResolvedDays < 1 || parsedConversationAutoArchiveResolvedDays > 365)) {
                return res.status(400).json({message: 'Le délai d’archivage des discussions résolues doit être compris entre 1 et 365 jours'});
            }

            const updatedSettings = await db.appSettings.upsert({
                where: {id: currentSettings?.id || 1},
                update: {
                    showFooter: showFooter !== undefined ? Boolean(showFooter) : undefined,
                    conversationAutoDeleteDays: hasConversationAutoDeleteDays ? parsedConversationAutoDeleteDays : undefined,
                    conversationAutoArchiveResolvedDays: hasConversationAutoArchiveResolvedDays ? parsedConversationAutoArchiveResolvedDays : undefined,
                    eventDiscussionNotificationsEnabled: eventDiscussionNotificationsEnabled !== undefined ? Boolean(eventDiscussionNotificationsEnabled) : undefined,
                },
                create: {
                    showFooter: showFooter !== undefined ? Boolean(showFooter) : defaultSettings.showFooter,
                    conversationAutoDeleteDays: hasConversationAutoDeleteDays ? parsedConversationAutoDeleteDays : defaultSettings.conversationAutoDeleteDays,
                    conversationAutoArchiveResolvedDays: hasConversationAutoArchiveResolvedDays ? parsedConversationAutoArchiveResolvedDays : defaultSettings.conversationAutoArchiveResolvedDays,
                    eventDiscussionNotificationsEnabled: eventDiscussionNotificationsEnabled !== undefined ? Boolean(eventDiscussionNotificationsEnabled) : defaultSettings.eventDiscussionNotificationsEnabled,
                },
            });

            res.status(200).json(updatedSettings);
            return;
        }

        if (req.method === 'OPTIONS') {
            const response = NextResponse.next();
            res.setHeader('Allow', ['GET', 'PUT', 'OPTIONS']);
            res.writeHead(204, Object.fromEntries(response.headers.entries()));
            res.end();
            return;
        }

        res.setHeader('Allow', ['GET', 'PUT', 'OPTIONS']);
        res.status(405).json({message: `Method ${req.method} not allowed`});
    } catch (error) {
        console.error('Erreur app-settings:', error);
        res.status(500).json({message: "Erreur lors de la sauvegarde des paramètres d'interface"});
    }
}
