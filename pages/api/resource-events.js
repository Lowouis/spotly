import nodemailer from 'nodemailer';
import db from '@/server/services/databaseService';
import {runMiddleware} from '@/services/server/core';
import {isAdminSession, requireAuth} from '@/services/server/api-auth';
import {decrypt} from '@/services/server/security';
import {buildEmailMessage, shouldSendDailyNotification} from '@/services/server/mails/mailer';
import {isEmailTemplateEnabled} from '@/services/server/mails/settings';
import {ensureResourceEventConversation} from '@/services/server/conversations';
import {hasOngoingReservation} from '@/services/server/resource-event-impact';

const eventInclude = {
    type: true,
    reportedBy: {select: {id: true, name: true, surname: true, username: true, email: true}},
    resource: {
        include: {
            owner: true,
            domains: {include: {owner: true}},
            category: {include: {owner: true}},
        },
    },
};

function getResourceOwner(resource) {
    return resource?.owner || resource?.category?.owner || resource?.domains?.owner || null;
}

function formatUser(user, fallback = 'Utilisateur') {
    return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.username || user?.email || fallback;
}

function formatDate(value) {
    if (!value) return 'Non renseignée';
    return new Intl.DateTimeFormat('fr-FR', {dateStyle: 'short', timeStyle: 'short'}).format(new Date(value));
}

function getEventTypeLabel(event) {
    return event?.type?.name || event?.customTypeName || 'Evénement';
}

async function sendProblemEmail(owner, event) {
    if (!owner?.email) return;
    if (!await isEmailTemplateEnabled(db, 'resourceProblemReported')) return;

    const smtpConfig = await db.smtpConfig.findFirst({where: {isActive: true}, orderBy: {lastUpdated: 'desc'}});
    if (!smtpConfig) return;

    const delivery = await shouldSendDailyNotification(db, {
        templateName: 'resourceProblemReported',
        to: owner.email,
        data: {eventId: event.id, resourceName: event.resource?.name},
    });
    if (!delivery.allowed) return;

    const transporter = nodemailer.createTransport({
        host: decrypt(smtpConfig.host),
        port: parseInt(decrypt(smtpConfig.port), 10),
        secure: smtpConfig.secure,
        auth: {user: decrypt(smtpConfig.username), pass: decrypt(smtpConfig.password)},
        tls: {rejectUnauthorized: false},
    });

    await transporter.sendMail(buildEmailMessage({
        from: `"${decrypt(smtpConfig.fromName)}" <${decrypt(smtpConfig.fromEmail)}>`,
        to: owner.email,
        subject: `Problème signalé sur ${event.resource?.name || 'une ressource'}`,
        templateName: 'resourceProblemReported',
        data: {
            subject: `Problème signalé sur ${event.resource?.name || 'une ressource'}`,
            ownerName: formatUser(owner, 'gestionnaire'),
            reporterName: formatUser(event.reportedBy),
            resourceName: event.resource?.name,
            resourceSite: event.resource?.domains?.name,
            resourceCategory: event.resource?.category?.name,
            eventTitle: event.title,
            eventType: getEventTypeLabel(event),
            severity: event.severity || 'Non renseigné',
            problemDate: formatDate(event.problemDate || event.startDate),
            description: event.description || 'Aucune description fournie.',
        },
    }));
}

async function notifyOwner(event) {
    const owner = getResourceOwner(event.resource);
    if (!owner?.id || Number(owner.id) === Number(event.reportedById)) return;

    await db.notification.create({
        data: {
            userId: owner.id,
            type: 'RESOURCE_PROBLEM_REPORTED',
            title: 'Problème ressource signalé',
            message: `${formatUser(event.reportedBy)} a signalé "${event.title}" sur ${event.resource?.name || 'une ressource'}.`,
        },
    });

    try {
        await sendProblemEmail(owner, event);
    } catch (error) {
        console.error('Resource problem email failed:', error);
    }
}

async function getAccessibleResource(session, resourceId, entryId = null) {
    if (isAdminSession(session)) {
        return db.resource.findUnique({where: {id: Number(resourceId)}, include: eventInclude.resource.include});
    }

    const entry = await db.entry.findFirst({
        where: {id: Number(entryId), userId: Number(session.user.id), moderate: 'USED'},
        include: {resource: {include: eventInclude.resource.include}},
    });

    if (!entry || Number(entry.resourceId) !== Number(resourceId)) return null;
    return entry.resource;
}

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method === 'OPTIONS') return res.status(200).json({message: 'OK'});
    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const session = await requireAuth(req, res);
    if (!session) return;

    if (req.method === 'GET') {
        if (!isAdminSession(session)) return res.status(403).json({message: 'Accès interdit'});

        const {domainId, categoryId, typeId, search} = req.query;
        const events = await db.resourceEvent.findMany({
            where: {
                ...(domainId && {resource: {domainId: Number(domainId)}}),
                ...(categoryId && {resource: {categoryId: Number(categoryId)}}),
                ...(typeId && {typeId: Number(typeId)}),
                ...(search && {
                    OR: [
                        {title: {contains: String(search)}},
                        {description: {contains: String(search)}},
                        {resource: {name: {contains: String(search)}}},
                    ],
                }),
            },
            include: eventInclude,
            orderBy: [{endDate: 'asc'}, {startDate: 'desc'}],
        });
        if (!db.conversation) {
            return res.status(200).json(events.map((event) => ({...event, conversation: null})));
        }

        const conversations = await db.conversation.findMany({
            where: {contextType: 'RESOURCE_EVENT', contextId: {in: events.map((event) => event.id)}},
        });
        const conversationByEventId = new Map(conversations.map((conversation) => [conversation.contextId, conversation]));
        return res.status(200).json(events.map((event) => ({...event, conversation: conversationByEventId.get(event.id) || null})));
    }

    if (req.method === 'PATCH') {
        if (!isAdminSession(session)) return res.status(403).json({message: 'Accès interdit'});

        const id = Number(req.body?.id);
        if (!id) return res.status(400).json({message: 'Identifiant obligatoire'});

        const existingEvent = await db.resourceEvent.findUnique({where: {id}, select: {startDate: true, resourceId: true, makesResourceUnavailable: true}});
        if (!existingEvent) return res.status(404).json({message: 'Événement introuvable'});
        const hasExplicitEndDate = Object.prototype.hasOwnProperty.call(req.body || {}, 'endDate');
        const nextEndDate = hasExplicitEndDate ? (req.body.endDate ? new Date(req.body.endDate) : null) : new Date();
        if (nextEndDate && Number.isNaN(nextEndDate.getTime())) {
            return res.status(400).json({message: 'Date de fin invalide'});
        }
        if (nextEndDate && nextEndDate < existingEvent.startDate) {
            return res.status(400).json({message: 'La date de fin doit être postérieure à la date de début'});
        }

        const now = new Date();
        const event = await db.resourceEvent.update({
            where: {id},
            data: {endDate: nextEndDate},
            include: eventInclude,
        });
        const conversation = db.conversation ? await ensureResourceEventConversation(event.id) : null;
        if (conversation) {
            await db.conversationMessage.create({
                data: {
                    conversationId: conversation.id,
                    userId: Number(session.user.id),
                    system: true,
                    content: `Date de fin de l’événement mise à jour : ${formatDate(event.endDate)}.`,
                },
            });
            if (Boolean(req.body?.archiveConversation) && event.endDate && event.endDate <= now) {
                await db.conversation.update({where: {id: conversation.id}, data: {status: 'ARCHIVED'}});
            }
        }
        if (!event.endDate && existingEvent.makesResourceUnavailable) {
            await db.resource.update({where: {id: existingEvent.resourceId}, data: {status: 'UNAVAILABLE'}});
        }
        if (event.endDate && event.endDate <= now) {
            const remainingOpenEvents = await db.resourceEvent.count({
                where: {
                    resourceId: event.resourceId,
                    makesResourceUnavailable: true,
                    id: {not: event.id},
                    OR: [{endDate: null}, {endDate: {gt: now}}],
                },
            });
            if (!remainingOpenEvents) {
                await db.resource.update({where: {id: event.resourceId}, data: {status: 'AVAILABLE'}});
            }
        }
        return res.status(200).json(event);
    }

    if (req.method === 'DELETE') {
        if (!isAdminSession(session)) return res.status(403).json({message: 'Accès interdit'});

        const id = Number(req.body?.id);
        if (!id) return res.status(400).json({message: 'Identifiant obligatoire'});

        const event = await db.resourceEvent.delete({where: {id}});
        const remainingOpenEvents = await db.resourceEvent.count({
            where: {resourceId: event.resourceId, makesResourceUnavailable: true, endDate: null},
        });
        if (!remainingOpenEvents) {
            await db.resource.update({where: {id: event.resourceId}, data: {status: 'AVAILABLE'}});
        }

        return res.status(200).json({message: 'Événement supprimé'});
    }

    try {
        const title = String(req.body?.title || '').trim();
        const resourceId = Number(req.body?.resourceId);
        const startDate = req.body?.startDate ? new Date(req.body.startDate) : null;
        const endDate = req.body?.endDate ? new Date(req.body.endDate) : null;
        const typeId = req.body?.typeId ? Number(req.body.typeId) : null;
        const customTypeName = String(req.body?.customTypeName || '').trim() || null;
        const customTypeIcon = String(req.body?.customTypeIcon || '').trim() || null;
        const entryId = req.body?.entryId ? Number(req.body.entryId) : null;

        if (!title || !resourceId || !startDate || Number.isNaN(startDate.getTime())) {
            return res.status(400).json({message: 'Titre, ressource et date de début sont obligatoires'});
        }
        if (!typeId && !customTypeName) {
            return res.status(400).json({message: 'Typologie obligatoire'});
        }

        const resource = await getAccessibleResource(session, resourceId, entryId);
        if (!resource) return res.status(404).json({message: 'Ressource introuvable'});

        const makesResourceUnavailable = Boolean(req.body?.makesResourceUnavailable) && isAdminSession(session);
        if (makesResourceUnavailable && await hasOngoingReservation(db, resourceId)) {
            return res.status(400).json({message: 'Impossible de rendre la ressource indisponible pendant une réservation en cours'});
        }

        const event = await db.resourceEvent.create({
            data: {
                resourceId,
                typeId,
                reportedById: Number(session.user.id),
                title,
                customTypeName,
                customTypeIcon,
                description: String(req.body?.description || '').trim() || null,
                severity: String(req.body?.severity || '').trim() || null,
                problemDate: req.body?.problemDate ? new Date(req.body.problemDate) : null,
                startDate,
                endDate,
                makesResourceUnavailable,
            },
            include: eventInclude,
        });

        if (db.conversation) {
            await ensureResourceEventConversation(event.id);
        }

        if (makesResourceUnavailable) {
            await db.resource.update({where: {id: resourceId}, data: {status: 'UNAVAILABLE'}});
        }

        if (!isAdminSession(session)) {
            await notifyOwner(event);
        }

        return res.status(201).json(event);
    } catch (error) {
        console.error('Resource event creation failed:', error);
        return res.status(500).json({
            message: 'Erreur lors de la création de l’événement ressource',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
}
