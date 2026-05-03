import db from '@/server/services/databaseService';
import {isAdminSession} from '@/services/server/api-auth';

const userSelect = {id: true, name: true, surname: true, username: true, email: true, role: true};

function formatUserName(user, fallback = 'Utilisateur') {
    return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.username || user?.email || fallback;
}

function getResourceOwner(resource) {
    return resource?.owner || resource?.category?.owner || resource?.domains?.owner || null;
}

function uniqueParticipants(participants) {
    const seen = new Set();
    return participants.filter((participant) => {
        if (!participant?.userId || seen.has(Number(participant.userId))) return false;
        seen.add(Number(participant.userId));
        return true;
    });
}

async function getResourceEvent(eventId) {
    return db.resourceEvent.findUnique({
        where: {id: Number(eventId)},
        include: {
            reportedBy: {select: userSelect},
            resource: {
                include: {
                    owner: {select: userSelect},
                    category: {include: {owner: {select: userSelect}}},
                    domains: {include: {owner: {select: userSelect}}},
                },
            },
        },
    });
}

export async function ensureResourceEventConversation(eventId) {
    const event = await getResourceEvent(eventId);
    if (!event) return null;

    const owner = getResourceOwner(event.resource);
    const participants = uniqueParticipants([
        event.reportedById && {userId: event.reportedById, role: 'REPORTER'},
        owner?.id && {userId: owner.id, role: 'OWNER'},
    ]);

    const conversation = await db.conversation.upsert({
        where: {contextType_contextId: {contextType: 'RESOURCE_EVENT', contextId: event.id}},
        update: {title: event.title},
        create: {
            contextType: 'RESOURCE_EVENT',
            contextId: event.id,
            title: event.title,
            participants: {create: participants},
            messages: {
                create: {
                    userId: event.reportedById || participants[0]?.userId,
                    system: true,
                    content: `Événement créé : ${event.title}`,
                },
            },
        },
    });

    for (const participant of participants) {
        await db.conversationParticipant.upsert({
            where: {conversationId_userId: {conversationId: conversation.id, userId: participant.userId}},
            update: {role: participant.role},
            create: {conversationId: conversation.id, ...participant},
        });
    }

    return conversation;
}

export async function getConversationForSession(session, conversationId) {
    const conversation = await db.conversation.findUnique({
        where: {id: Number(conversationId)},
        include: {
            participants: {include: {user: {select: userSelect}}, orderBy: {createdAt: 'asc'}},
            messages: {include: {user: {select: userSelect}}, orderBy: {createdAt: 'asc'}},
        },
    });
    if (!conversation) return null;

    const isParticipant = conversation.participants.some((participant) => Number(participant.userId) === Number(session.user.id));
    if (!isParticipant && !isAdminSession(session)) return null;

    await db.conversationParticipant.updateMany({
        where: {conversationId: conversation.id, userId: Number(session.user.id)},
        data: {readAt: new Date()},
    });

    return conversation;
}

export async function addConversationMessage(session, conversationId, content) {
    const normalizedContent = String(content || '').trim();
    if (!normalizedContent) return null;

    const conversation = await getConversationForSession(session, conversationId);
    if (!conversation || conversation.status === 'ARCHIVED') return null;

    const message = await db.conversationMessage.create({
        data: {
            conversationId: conversation.id,
            userId: Number(session.user.id),
            content: normalizedContent,
        },
        include: {user: {select: userSelect}},
    });

    await db.conversationParticipant.updateMany({
        where: {conversationId: conversation.id, userId: {not: Number(session.user.id)}},
        data: {readAt: null},
    });
    await db.conversation.update({where: {id: conversation.id}, data: {updatedAt: new Date()}});

    await notifyMentionedParticipants(conversation, normalizedContent, Number(session.user.id));

    return message;
}

async function notifyMentionedParticipants(conversation, content, authorId) {
    if (conversation.contextType === 'RESOURCE_EVENT') {
        const settings = await db.appSettings.findFirst();
        if (settings?.eventDiscussionNotificationsEnabled === false) return;
    }

    const tokens = [...content.matchAll(/@([\p{L}\p{N}._-]+)/gu)].map((match) => match[1].toLowerCase());
    if (!tokens.length) return;

    const mentionedParticipants = conversation.participants.filter((participant) => {
        if (Number(participant.userId) === authorId) return false;
        const user = participant.user || {};
        const names = [user.username, user.email, user.name, user.surname]
            .filter(Boolean)
            .map((value) => String(value).toLowerCase());
        return tokens.some((token) => names.some((name) => name.includes(token)));
    });

    await Promise.all(mentionedParticipants.map((participant) => db.notification.create({
        data: {
            userId: participant.userId,
            type: 'CONVERSATION_UNREAD',
            title: 'Mention dans une discussion',
            message: `Vous avez été mentionné dans "${conversation.title || 'une discussion'}".`,
        },
    }).catch(() => null)));
}

export async function addConversationParticipant(session, conversationId, userId) {
    const conversation = await getConversationForSession(session, conversationId);
    if (!conversation || !canManageConversation(session, conversation)) return null;

    return db.conversationParticipant.upsert({
        where: {conversationId_userId: {conversationId: conversation.id, userId: Number(userId)}},
        update: {},
        create: {conversationId: conversation.id, userId: Number(userId), role: 'PARTICIPANT'},
        include: {user: {select: userSelect}},
    });
}

export async function removeConversationParticipant(session, conversationId, userId) {
    const conversation = await getConversationForSession(session, conversationId);
    if (!conversation || !canManageConversation(session, conversation)) return null;

    const participant = conversation.participants.find((item) => Number(item.userId) === Number(userId));
    if (!participant || participant.role === 'REPORTER' || Number(participant.userId) === Number(session.user.id)) return null;

    await db.conversationParticipant.delete({where: {conversationId_userId: {conversationId: conversation.id, userId: Number(userId)}}});
    return {id: participant.id};
}

export async function deleteConversationForSession(session, conversationId) {
    const conversation = await getConversationForSession(session, conversationId);
    if (!conversation) return null;

    await db.conversationMessage.deleteMany({where: {conversationId: conversation.id}});
    if (conversation.contextType === 'ENTRY') {
        await db.entryMessage.deleteMany({where: {entryId: conversation.contextId}});
    }

    await db.conversation.delete({where: {id: conversation.id}});
    return {count: conversation.messages.length};
}

async function closeResourceEventOnArchive(tx, eventId, archivedAt) {
    const event = await tx.resourceEvent.findUnique({
        where: {id: Number(eventId)},
        select: {id: true, resourceId: true, endDate: true, makesResourceUnavailable: true},
    });
    if (!event) return;

    if (event.endDate && new Date(event.endDate) <= archivedAt) return;

    await tx.resourceEvent.update({
        where: {id: event.id},
        data: {endDate: archivedAt},
    });

    if (!event.makesResourceUnavailable) return;

    const remainingOpenEvents = await tx.resourceEvent.count({
        where: {
            resourceId: event.resourceId,
            makesResourceUnavailable: true,
            id: {not: event.id},
            OR: [{endDate: null}, {endDate: {gt: archivedAt}}],
        },
    });

    if (!remainingOpenEvents) {
        await tx.resource.update({where: {id: event.resourceId}, data: {status: 'AVAILABLE'}});
    }
}

export async function updateConversationStatus(session, conversationId, status) {
    const conversation = await getConversationForSession(session, conversationId);
    if (!conversation || !canManageConversation(session, conversation) || conversation.status === 'ARCHIVED' || !['OPEN', 'RESOLVED', 'ARCHIVED'].includes(status)) return null;

    if (conversation.contextType === 'RESOURCE_EVENT' && status === 'ARCHIVED') {
        const archivedAt = new Date();

        return db.$transaction(async (tx) => {
            await closeResourceEventOnArchive(tx, conversation.contextId, archivedAt);
            return tx.conversation.update({where: {id: conversation.id}, data: {status}});
        });
    }

    return db.conversation.update({where: {id: conversation.id}, data: {status}});
}

function canManageConversation(session, conversation) {
    if (isAdminSession(session)) return true;
    return conversation.participants.some((participant) => (
        Number(participant.userId) === Number(session.user.id) && participant.role === 'OWNER'
    ));
}

export async function archiveResolvedConversations(dbClient, resolvedDays = 7, now = new Date()) {
    const days = Number.isInteger(Number(resolvedDays)) ? Number(resolvedDays) : 7;
    const safeDays = Math.min(Math.max(days, 1), 365);
    const cutoff = new Date(now.getTime() - safeDays * 24 * 60 * 60 * 1000);

    const result = await dbClient.conversation.updateMany({
        where: {
            status: 'RESOLVED',
            updatedAt: {lte: cutoff},
            messages: {none: {createdAt: {gt: cutoff}}},
        },
        data: {status: 'ARCHIVED'},
    });

    return {count: result.count, days: safeDays};
}

export async function getResourceEventConversationsForSession(session) {
    const userId = Number(session.user.id);
    const conversations = await db.conversation.findMany({
        where: {
            contextType: 'RESOURCE_EVENT',
            participants: {some: {userId}},
            status: 'OPEN',
            messages: {some: {system: false}},
        },
        include: {
            participants: true,
            messages: {orderBy: {createdAt: 'desc'}, include: {user: {select: userSelect}}},
        },
        orderBy: {updatedAt: 'desc'},
    });
    const events = await db.resourceEvent.findMany({
        where: {id: {in: conversations.map((conversation) => conversation.contextId)}},
        include: {resource: {include: {domains: true, category: true}}},
    });
    const eventById = new Map(events.map((event) => [event.id, event]));

    return conversations.map((conversation) => {
        const event = eventById.get(conversation.contextId);
        const participant = conversation.participants.find((item) => Number(item.userId) === userId);
        const unreadCount = conversation.messages.filter((message) => (
            Number(message.userId) !== userId && (!participant?.readAt || new Date(message.createdAt) > new Date(participant.readAt))
        )).length;

        return {
            conversationId: conversation.id,
            contextType: conversation.contextType,
            status: conversation.status,
            resourceName: event?.title || conversation.title || 'Maintenance',
            ownerName: 'Maintenance',
            ownerInitials: 'M',
            siteName: event?.resource?.domains?.name || 'Maintenance',
            categoryName: event?.resource?.category?.name || 'Événement',
            reservationLabel: event?.resource?.name || 'Discussion de maintenance',
            startDate: event?.startDate || conversation.createdAt,
            endDate: event?.endDate || null,
            lastMessage: conversation.messages[0] || null,
            unreadCount,
            updatedAt: conversation.messages[0]?.createdAt || conversation.updatedAt,
        };
    }).sort((a, b) => new Date(b.lastMessage?.createdAt || b.updatedAt) - new Date(a.lastMessage?.createdAt || a.updatedAt));
}

export function getConversationAuthorName(message, currentUserId) {
    if (Number(message.userId) === Number(currentUserId)) return 'Vous';
    return formatUserName(message.user, 'Participant');
}
