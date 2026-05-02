import {NextResponse} from 'next/server';
import {runMiddleware} from '@/services/server/core';
import {requireAuth} from '@/services/server/api-auth';
import {addConversationMessage, addConversationParticipant, deleteConversationForSession, getConversationForSession, removeConversationParticipant, updateConversationStatus} from '@/services/server/conversations';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const session = req.method === 'OPTIONS' ? null : await requireAuth(req, res);
    if (req.method !== 'OPTIONS' && !session) return;

    const {id} = req.query;

    if (req.method === 'GET') {
        const conversation = await getConversationForSession(session, id);
        if (!conversation) return res.status(404).json({message: 'Conversation introuvable'});
        return res.status(200).json(conversation);
    }

    if (req.method === 'POST') {
        const message = await addConversationMessage(session, id, req.body?.content);
        if (!message) return res.status(400).json({message: 'Message invalide'});
        return res.status(201).json(message);
    }

    if (req.method === 'PUT') {
        if (req.body?.removeUserId) {
            const participant = await removeConversationParticipant(session, id, req.body.removeUserId);
            if (!participant) return res.status(400).json({message: 'Participant invalide'});
            return res.status(200).json(participant);
        }

        if (req.body?.userId) {
            const participant = await addConversationParticipant(session, id, req.body.userId);
            if (!participant) return res.status(400).json({message: 'Participant invalide'});
            return res.status(200).json(participant);
        }

        if (req.body?.status) {
            const conversation = await updateConversationStatus(session, id, req.body.status);
            if (!conversation) return res.status(400).json({message: 'Statut invalide'});
            return res.status(200).json(conversation);
        }
    }

    if (req.method === 'DELETE') {
        const result = await deleteConversationForSession(session, id);
        if (!result) return res.status(404).json({message: 'Conversation introuvable'});
        return res.status(200).json({message: 'Discussion supprimée', count: result.count});
    }

    if (req.method === 'OPTIONS') {
        const response = NextResponse.next();
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
        res.writeHead(204, Object.fromEntries(response.headers.entries()));
        return res.end();
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
    return res.status(405).json({message: `Method ${req.method} not allowed`});
}
