import {NextResponse} from 'next/server';
import {runMiddleware} from '@/services/server/core';
import {requireAuth} from '@/services/server/api-auth';
import {createEntryMessage, deleteEntryMessages, getAccessibleEntry, getEntryMessages} from '@/services/server/entry-messages';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const session = req.method === 'OPTIONS' ? null : await requireAuth(req, res);
    if (req.method !== 'OPTIONS' && !session) return;

    const {id} = req.query;

    if (req.method === 'GET') {
        try {
            const data = await getEntryMessages(session, id);
            if (!data) return res.status(404).json({message: 'Conversation introuvable'});

            return res.status(200).json(data);
        } catch (error) {
            console.error('Failed to fetch entry messages:', error);
            return res.status(500).json({message: 'Erreur lors de la récupération des messages'});
        }
    }

    if (req.method === 'POST') {
        try {
            const entry = await getAccessibleEntry(session, id);
            if (!entry) return res.status(404).json({message: 'Conversation introuvable'});

            const message = await createEntryMessage({
                entryId: id,
                userId: session.user.id,
                content: req.body?.content,
            });

            if (!message) return res.status(400).json({message: 'Le message ne peut pas être vide'});

            return res.status(201).json(message);
        } catch (error) {
            console.error('Failed to create entry message:', error);
            return res.status(500).json({message: 'Erreur lors de la création du message'});
        }
    }

    if (req.method === 'DELETE') {
        try {
            const result = await deleteEntryMessages(session, id);
            if (!result) return res.status(404).json({message: 'Conversation introuvable'});

            return res.status(200).json({message: 'Discussion supprimée', count: result.count});
        } catch (error) {
            console.error('Failed to delete entry messages:', error);
            return res.status(500).json({message: 'Erreur lors de la suppression de la discussion'});
        }
    }

    if (req.method === 'OPTIONS') {
        const response = NextResponse.next();
        res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
        res.writeHead(204, Object.fromEntries(response.headers.entries()));
        return res.end();
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
    return res.status(405).json({message: `Method ${req.method} not allowed`});
}
