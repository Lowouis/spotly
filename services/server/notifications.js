import db from '@/server/services/databaseService';
import {isAdminSession} from '@/services/server/api-auth';
import {ensureEntryConversation, getAccessibleEntryWhere} from '@/services/server/entry-messages';

const READ_RETENTION_MS = 48 * 60 * 60 * 1000;

const GENERATED_TYPES = [
    'RESERVATION_DELAYED',
    'RESERVATION_START_MISSED',
    'RESERVATION_REJECTED',
    'RESERVATION_WAITING_CONFIRMATION',
    'MESSAGE_UNREAD',
    'CONVERSATION_UNREAD',
];

function formatResource(entry) {
    return entry.resource?.name ? ` pour ${entry.resource.name}` : '';
}

function formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(date);
}

function getOwnerFilter(userId) {
    return {
        OR: [
            {ownerId: userId},
            {category: {ownerId: userId}},
            {domains: {ownerId: userId}},
        ],
    };
}

async function cleanupReadNotifications(now) {
    const expiresBefore = new Date(now.getTime() - READ_RETENTION_MS);

    await db.notification.updateMany({
        where: {
            readAt: {lte: expiresBefore},
            deletedAt: null,
        },
        data: {
            deletedAt: now,
        },
    });
}

async function upsertNotification(notification) {
    await db.notification.upsert({
        where: {
            userId_type_entryId: {
                userId: notification.userId,
                type: notification.type,
                entryId: notification.entryId,
            },
        },
        update: {
            title: notification.title,
            message: notification.message,
        },
        create: notification,
    });
}

async function buildUserNotifications(userId, now) {
    const entries = await db.entry.findMany({
        where: {
            userId,
            moderate: {in: ['ACCEPTED', 'USED', 'WAITING', 'REJECTED']},
        },
        include: {
            resource: {select: {name: true}},
        },
    });

    return entries.flatMap((entry) => {
        const notifications = [];
        const startDate = new Date(entry.startDate);
        const endDate = new Date(entry.endDate);
        const resourceLabel = formatResource(entry);

        if (entry.moderate === 'USED' && endDate < now) {
            notifications.push({
                userId,
                entryId: entry.id,
                type: 'RESERVATION_DELAYED',
                title: 'Réservation en retard',
                message: `Votre réservation${resourceLabel} aurait dû être restituée le ${formatDate(endDate)}.`,
            });
        }

        if (['ACCEPTED', 'WAITING'].includes(entry.moderate) && startDate < now) {
            notifications.push({
                userId,
                entryId: entry.id,
                type: 'RESERVATION_START_MISSED',
                title: 'Réservation à démarrer',
                message: `Votre réservation${resourceLabel} devait commencer le ${formatDate(startDate)} et n'est pas en cours.`,
            });
        }

        if (entry.moderate === 'REJECTED') {
            notifications.push({
                userId,
                entryId: entry.id,
                type: 'RESERVATION_REJECTED',
                title: 'Réservation refusée',
                message: `Votre réservation${resourceLabel} a été refusée.`,
            });
        }

        return notifications;
    });
}

async function buildAdminNotifications(session, now) {
    if (!isAdminSession(session)) return [];

    const userId = Number(session.user.id);
    const isSuperAdmin = session.user.role === 'SUPERADMIN';
    const entries = await db.entry.findMany({
        where: {
            moderate: 'WAITING',
            ...(!isSuperAdmin && {resource: getOwnerFilter(userId)}),
        },
        include: {
            resource: {select: {name: true}},
            user: {select: {name: true, surname: true, username: true, email: true}},
        },
    });

    return entries.map((entry) => {
        const requester = [entry.user?.name, entry.user?.surname].filter(Boolean).join(' ') || entry.user?.username || entry.user?.email || 'Un utilisateur';
        return {
            userId,
            entryId: entry.id,
            type: 'RESERVATION_WAITING_CONFIRMATION',
            title: 'Réservation à confirmer',
            message: `${requester} attend une confirmation${formatResource(entry)} pour le ${formatDate(new Date(entry.startDate))}.`,
        };
    });
}

async function buildUnreadMessageNotifications(session) {
    const userId = Number(session.user.id);
    const legacyEntries = await db.entry.findMany({where: getAccessibleEntryWhere(session, {messages: {some: {}}}), select: {id: true}});
    await Promise.all(legacyEntries.map((entry) => ensureEntryConversation(entry.id)));

    const participantRows = await db.conversationParticipant.findMany({
        where: {
            userId,
            conversation: {contextType: 'ENTRY', messages: {some: {userId: {not: userId}}}},
        },
        include: {
            conversation: {
                include: {
                    messages: {where: {userId: {not: userId}}, orderBy: {createdAt: 'desc'}},
                },
            },
        },
    });
    const entryIds = participantRows.map((participant) => participant.conversation.contextId);
    const entries = await db.entry.findMany({
        where: getAccessibleEntryWhere(session, {id: {in: entryIds}}),
        include: {resource: {select: {name: true}}},
    });
    const entryById = new Map(entries.map((entry) => [entry.id, entry]));

    return participantRows.flatMap((participant) => {
        const unreadCount = participant.conversation.messages.filter((message) => (
            !participant.readAt || new Date(message.createdAt) > new Date(participant.readAt)
        )).length;
        const entry = entryById.get(participant.conversation.contextId);
        if (!entry || !unreadCount) return [];

        return [{
            userId,
            entryId: entry.id,
            type: 'CONVERSATION_UNREAD',
            title: 'Message non lu',
            message: `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}${formatResource(entry)}.`,
        }];
    });
}

export async function syncNotificationsForSession(session) {
    const now = new Date();
    const userId = Number(session.user.id);

    await cleanupReadNotifications(now);

    const activeNotifications = [
        ...await buildUserNotifications(userId, now),
        ...await buildAdminNotifications(session, now),
        ...await buildUnreadMessageNotifications(session),
    ];
    const activeConditions = activeNotifications.map((notification) => ({
        userId: notification.userId,
        type: notification.type,
        entryId: notification.entryId,
    }));

    for (const notification of activeNotifications) {
        await upsertNotification(notification);
    }

    await db.notification.updateMany({
        where: {
            userId,
            deletedAt: null,
            type: {in: GENERATED_TYPES},
            ...(activeConditions.length > 0 ? {NOT: activeConditions} : {}),
        },
        data: {
            deletedAt: now,
        },
    });
}

export async function getNotificationsForSession(session) {
    await syncNotificationsForSession(session);

    return db.notification.findMany({
        where: {
            userId: Number(session.user.id),
            deletedAt: null,
        },
        orderBy: [
            {readAt: 'asc'},
            {createdAt: 'desc'},
        ],
        take: 50,
    });
}

export async function markNotificationsAsRead(session, notificationId = null) {
    const now = new Date();

    return db.notification.updateMany({
        where: {
            userId: Number(session.user.id),
            deletedAt: null,
            readAt: null,
            ...(notificationId && {id: notificationId}),
        },
        data: {
            readAt: now,
        },
    });
}

export async function deleteNotificationsForSession(session, notificationId = null) {
    return db.notification.updateMany({
        where: {
            userId: Number(session.user.id),
            deletedAt: null,
            ...(notificationId && {id: notificationId}),
        },
        data: {
            deletedAt: new Date(),
        },
    });
}
