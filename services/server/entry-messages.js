import db from '@/server/services/databaseService';
import {isAdminSession} from '@/services/server/api-auth';

function getManagedResourceFilter(userId) {
    return {
        OR: [
            {ownerId: userId},
            {category: {ownerId: userId}},
            {domains: {ownerId: userId}},
        ],
    };
}

export function getAccessibleEntryWhere(session, extraWhere = {}) {
    const userId = Number(session.user.id);

    if (session.user.role === 'SUPERADMIN') {
        return extraWhere;
    }

    if (isAdminSession(session)) {
        return {
            AND: [
                extraWhere,
                {
                    OR: [
                        {userId},
                        {resource: getManagedResourceFilter(userId)},
                    ],
                },
            ],
        };
    }

    return {
        ...extraWhere,
        userId,
    };
}

const entryInclude = {
    user: {
        select: {
            id: true,
            name: true,
            surname: true,
            username: true,
            email: true,
            role: true,
        },
    },
    resource: {
        include: {
            domains: {
                include: {
                    owner: true,
                },
            },
            category: {
                include: {
                    owner: true,
                },
            },
            owner: {
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    username: true,
                    email: true,
                },
            },
        },
    },
};

const userSelect = {
    id: true,
    name: true,
    surname: true,
    username: true,
    email: true,
    role: true,
};

function getResourceOwner(resource) {
    return resource?.owner || resource?.category?.owner || resource?.domains?.owner || null;
}

function formatUserName(user, fallback = 'Correspondant') {
    return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.username || fallback;
}

function formatUserInitials(user, fallback = 'C') {
    return [user?.name, user?.surname]
        .filter(Boolean)
        .map((value) => value.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase() || fallback;
}

export async function getAccessibleEntry(session, entryId) {
    return db.entry.findFirst({
        where: getAccessibleEntryWhere(session, {id: Number(entryId)}),
        include: entryInclude,
    });
}

function uniqueParticipants(participants) {
    const seen = new Set();
    return participants.filter((participant) => {
        if (!participant?.userId || seen.has(Number(participant.userId))) return false;
        seen.add(Number(participant.userId));
        return true;
    });
}

async function syncLegacyParticipantReadAt(conversationId, participants, legacyMessages) {
    for (const participant of participants) {
        const messagesFromOthers = legacyMessages.filter((message) => Number(message.userId) !== Number(participant.userId));
        const hasUnread = messagesFromOthers.some((message) => !message.readAt);
        const latestReadAt = messagesFromOthers.reduce((latest, message) => {
            if (!message.readAt) return latest;
            return !latest || message.readAt > latest ? message.readAt : latest;
        }, null);

        await db.conversationParticipant.updateMany({
            where: {conversationId, userId: participant.userId},
            data: {readAt: hasUnread ? null : latestReadAt || new Date()},
        });
    }
}

export async function ensureEntryConversation(entryId) {
    const entry = await db.entry.findUnique({
        where: {id: Number(entryId)},
        include: entryInclude,
    });
    if (!entry) return null;

    const owner = getResourceOwner(entry.resource);
    const participants = uniqueParticipants([
        {userId: entry.userId, role: 'REPORTER'},
        owner?.id && {userId: owner.id, role: 'OWNER'},
    ]);

    const conversation = await db.conversation.upsert({
        where: {contextType_contextId: {contextType: 'ENTRY', contextId: entry.id}},
        update: {title: entry.resource?.name || `Réservation #${entry.id}`},
        create: {
            contextType: 'ENTRY',
            contextId: entry.id,
            title: entry.resource?.name || `Réservation #${entry.id}`,
            participants: {create: participants},
        },
    });

    for (const participant of participants) {
        await db.conversationParticipant.upsert({
            where: {conversationId_userId: {conversationId: conversation.id, userId: participant.userId}},
            update: {role: participant.role},
            create: {conversationId: conversation.id, ...participant},
        });
    }

    const [messageCount, legacyMessages] = await Promise.all([
        db.conversationMessage.count({where: {conversationId: conversation.id}}),
        db.entryMessage.findMany({where: {entryId: entry.id}, orderBy: {createdAt: 'asc'}}),
    ]);

    if (!messageCount && legacyMessages.length) {
        for (const message of legacyMessages) {
            await db.conversationMessage.create({
                data: {
                    conversationId: conversation.id,
                    userId: message.userId,
                    content: message.content,
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt,
                },
            });
        }
        await syncLegacyParticipantReadAt(conversation.id, participants, legacyMessages);
    }

    return conversation;
}

async function getEntryConversationForSession(session, entryId, migrateLegacy = true) {
    const entry = await getAccessibleEntry(session, entryId);
    if (!entry) return null;

    if (migrateLegacy) await ensureEntryConversation(entry.id);

    const conversation = await db.conversation.findUnique({
        where: {contextType_contextId: {contextType: 'ENTRY', contextId: entry.id}},
        include: {
            participants: {include: {user: {select: userSelect}}, orderBy: {createdAt: 'asc'}},
            messages: {include: {user: {select: userSelect}}, orderBy: {createdAt: 'asc'}},
        },
    });
    if (!conversation) return null;

    return {...conversation, entry};
}

async function markEntryConversationRead(session, entryId, conversationId) {
    const now = new Date();
    await db.conversationParticipant.updateMany({
        where: {conversationId, userId: Number(session.user.id)},
        data: {readAt: now},
    });

    await db.entryMessage.updateMany({
        where: {entryId: Number(entryId), userId: {not: Number(session.user.id)}, readAt: null},
        data: {readAt: now},
    });
}

export async function createEntryMessage({entryId, userId, content}) {
    const normalizedContent = String(content || '').trim();
    if (!normalizedContent) return null;

    const conversation = await ensureEntryConversation(entryId);
    if (!conversation) return null;

    const message = await db.conversationMessage.create({
        data: {
            conversationId: conversation.id,
            userId: Number(userId),
            content: normalizedContent,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    surname: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    await db.conversationParticipant.updateMany({
        where: {conversationId: conversation.id, userId: {not: Number(userId)}},
        data: {readAt: null},
    });
    await db.conversation.update({where: {id: conversation.id}, data: {updatedAt: new Date()}});

    return message;
}

export async function deleteEntryMessages(session, entryId) {
    const conversation = await getEntryConversationForSession(session, entryId);
    if (!conversation) return null;

    const result = await db.conversationMessage.deleteMany({
        where: {conversationId: conversation.id},
    });

    await db.entryMessage.deleteMany({where: {entryId: Number(entryId)}});
    await db.conversation.delete({where: {id: conversation.id}});
    return result;
}

export async function deleteInactiveEntryMessages(dbClient, inactiveDays = 7, now = new Date()) {
    const days = Number.isInteger(Number(inactiveDays)) ? Number(inactiveDays) : 7;
    const safeDays = Math.min(Math.max(days, 1), 365);
    const cutoff = new Date(now.getTime() - safeDays * 24 * 60 * 60 * 1000);
    const staleEntries = await dbClient.entry.findMany({
        where: {
            messages: {some: {}},
            NOT: {
                messages: {
                    some: {
                        createdAt: {gte: cutoff},
                    },
                },
            },
        },
        select: {id: true},
    });

    if (!staleEntries.length) return {count: 0, cutoff, days: safeDays};

    const result = await dbClient.entryMessage.deleteMany({
        where: {
            entryId: {in: staleEntries.map((entry) => entry.id)},
        },
    });

    return {count: result.count, cutoff, days: safeDays};
}

export async function getEntryMessages(session, entryId) {
    const conversation = await getEntryConversationForSession(session, entryId);
    if (!conversation) return null;

    await markEntryConversationRead(session, conversation.entry.id, conversation.id);

    await db.notification.updateMany({
        where: {
            userId: Number(session.user.id),
            entryId: Number(entryId),
            type: {in: ['MESSAGE_UNREAD', 'CONVERSATION_UNREAD']},
            deletedAt: null,
        },
        data: {
            readAt: new Date(),
            deletedAt: new Date(),
        },
    });

    return {
        entry: conversation.entry,
        conversation: {...conversation, entry: undefined},
        messages: conversation.messages,
    };
}

function formatConversationDate(entry) {
    const start = new Date(entry.startDate);
    const end = new Date(entry.endDate);
    const date = new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: 'short'}).format(start);
    const startTime = new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit'}).format(start);
    const endTime = new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit'}).format(end);

    return `${date}, ${startTime} - ${endTime}`;
}

export async function getConversationsForSession(session, focusedEntryId = null) {
    const userId = Number(session.user.id);
    const focusedEntryFilter = focusedEntryId ? {id: Number(focusedEntryId)} : null;
    const entryConversationContexts = await db.conversation.findMany({
        where: {contextType: 'ENTRY', messages: {some: {system: false}}},
        select: {contextId: true},
    });
    const conversationEntryIds = entryConversationContexts.map((conversation) => conversation.contextId);
    const conversationFilters = [
        ...(conversationEntryIds.length ? [{id: {in: conversationEntryIds}}] : []),
        {messages: {some: {}}},
        ...(focusedEntryFilter ? [focusedEntryFilter] : []),
    ];
    const entries = await db.entry.findMany({
        where: getAccessibleEntryWhere(session, {OR: conversationFilters}),
        include: {
            ...entryInclude,
            messages: {select: {id: true}},
        },
        orderBy: {updatedAt: 'desc'},
    });

    await Promise.all(entries.map((entry) => ensureEntryConversation(entry.id)));

    const conversations = await db.conversation.findMany({
        where: {
            contextType: 'ENTRY',
            contextId: {in: entries.map((entry) => entry.id)},
            status: 'OPEN',
            OR: [
                {messages: {some: {system: false}}},
                ...(focusedEntryId ? [{contextId: Number(focusedEntryId)}] : []),
            ],
        },
        include: {
            participants: true,
            messages: {
                orderBy: {createdAt: 'desc'},
                include: {user: {select: userSelect}},
            },
        },
    });
    const conversationByEntryId = new Map(conversations.map((conversation) => [conversation.contextId, conversation]));

    return entries
        .map((entry) => {
            const conversation = conversationByEntryId.get(entry.id);
            const lastMessage = conversation?.messages[0] || null;
            if (!conversation || (!lastMessage && !focusedEntryId)) return null;
            const owner = getResourceOwner(entry.resource);
            const correspondent = Number(owner?.id) === userId ? entry.user : owner;
            const participant = conversation?.participants.find((item) => Number(item.userId) === userId);
            const unreadCount = (conversation?.messages || []).filter((message) => (
                Number(message.userId) !== userId && (!participant?.readAt || new Date(message.createdAt) > new Date(participant.readAt))
            )).length;

            return {
                conversationId: conversation?.id,
                contextType: conversation?.contextType || 'ENTRY',
                entryId: entry.id,
                status: entry.moderate,
                resourceName: entry.resource?.name || 'Ressource inconnue',
                ownerName: formatUserName(correspondent, 'Responsable'),
                ownerInitials: formatUserInitials(correspondent, 'R'),
                siteName: entry.resource?.domains?.name || 'Site',
                categoryName: entry.resource?.category?.name || 'Catégorie',
                reservationLabel: formatConversationDate(entry),
                startDate: entry.startDate,
                endDate: entry.endDate,
                lastMessage,
                unreadCount,
                updatedAt: lastMessage?.createdAt || entry.updatedAt,
            };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.lastMessage?.createdAt || b.updatedAt) - new Date(a.lastMessage?.createdAt || a.updatedAt));
}
