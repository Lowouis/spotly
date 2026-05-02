import {NextResponse} from 'next/server';
import {runMiddleware} from '@/services/server/core';
import {requireAuth} from '@/services/server/api-auth';
import {getConversationsForSession} from '@/services/server/entry-messages';
import {getResourceEventConversationsForSession} from '@/services/server/conversations';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const session = req.method === 'OPTIONS' ? null : await requireAuth(req, res);
    if (req.method !== 'OPTIONS' && !session) return;

    if (req.method === 'GET') {
        if (req.query.contextType && !['ENTRY', 'RESOURCE_EVENT'].includes(req.query.contextType)) {
            return res.status(400).json({message: 'Type de conversation invalide'});
        }

        try {
            const conversations = req.query.contextType === 'RESOURCE_EVENT'
                ? await getResourceEventConversationsForSession(session)
                : [
                    ...await getConversationsForSession(session, req.query.entryId),
                    ...(req.query.contextType === 'ENTRY' || req.query.entryId ? [] : await getResourceEventConversationsForSession(session)),
                ].sort((a, b) => new Date(b.lastMessage?.createdAt || b.updatedAt) - new Date(a.lastMessage?.createdAt || a.updatedAt));
            return res.status(200).json({conversations});
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            return res.status(500).json({message: 'Erreur lors de la récupération des conversations'});
        }
    }

    if (req.method === 'OPTIONS') {
        const response = NextResponse.next();
        res.setHeader('Allow', ['GET', 'OPTIONS']);
        res.writeHead(204, Object.fromEntries(response.headers.entries()));
        return res.end();
    }

    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({message: `Method ${req.method} not allowed`});
}
