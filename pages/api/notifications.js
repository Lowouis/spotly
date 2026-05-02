import {NextResponse} from 'next/server';
import {runMiddleware} from '@/services/server/core';
import {requireAuth} from '@/services/server/api-auth';
import {deleteNotificationsForSession, getNotificationsForSession, markNotificationsAsRead} from '@/services/server/notifications';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const session = req.method === 'OPTIONS' ? null : await requireAuth(req, res);
    if (req.method !== 'OPTIONS' && !session) return;

    if (req.method === 'GET') {
        try {
            const notifications = await getNotificationsForSession(session);
            return res.status(200).json({
                notifications,
                unreadCount: notifications.filter((notification) => !notification.readAt).length,
            });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            return res.status(500).json({message: 'Erreur lors de la récupération des notifications'});
        }
    }

    if (req.method === 'PUT') {
        try {
            const notificationId = req.body?.id ? Number(req.body.id) : null;
            await markNotificationsAsRead(session, notificationId);
            return res.status(200).json({message: 'Notifications mises à jour'});
        } catch (error) {
            console.error('Failed to update notifications:', error);
            return res.status(500).json({message: 'Erreur lors de la mise à jour des notifications'});
        }
    }

    if (req.method === 'DELETE') {
        try {
            const notificationId = req.body?.id ? Number(req.body.id) : null;
            await deleteNotificationsForSession(session, notificationId);
            return res.status(200).json({message: 'Notifications supprimées'});
        } catch (error) {
            console.error('Failed to delete notifications:', error);
            return res.status(500).json({message: 'Erreur lors de la suppression des notifications'});
        }
    }

    if (req.method === 'OPTIONS') {
        const response = NextResponse.next();
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'OPTIONS']);
        res.writeHead(204, Object.fromEntries(response.headers.entries()));
        return res.end();
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'OPTIONS']);
    return res.status(405).json({message: `Method ${req.method} not allowed`});
}
