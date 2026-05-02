import nodemailer from 'nodemailer';
import db from '@/server/services/databaseService';
import {runMiddleware} from '@/services/server/core';
import {requireAuth} from '@/services/server/api-auth';
import {decrypt} from '@/services/server/security';
import {buildEmailMessage, buildNotificationContextKey, notificationDateKey} from '@/services/server/mails/mailer';
import {isEmailTemplateEnabled} from '@/services/server/mails/settings';
import {createEntryMessage} from '@/services/server/entry-messages';

const includeEntry = {
    user: true,
    resource: {
        include: {
            owner: true,
            category: {include: {owner: true}},
            domains: {include: {owner: true}},
        },
    },
};

function formatUser(user, fallback = 'Utilisateur') {
    return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.username || user?.email || fallback;
}

function getResourceOwner(resource) {
    return resource?.owner || resource?.category?.owner || resource?.domains?.owner || null;
}

async function reserveDailyBlockingAlert(recipient, currentEntry, previousEntry) {
    const templateName = 'latePickupWarning';
    const dateKey = notificationDateKey();
    const contextKey = buildNotificationContextKey({
        templateName,
        to: recipient,
        data: {entryId: currentEntry.id, previousEntryId: previousEntry.id},
    });

    try {
        await db.emailNotificationLog.create({
            data: {templateName, recipient, contextKey, dateKey},
        });
        return true;
    } catch (error) {
        if (error?.code === 'P2002') return false;
        throw error;
    }
}

async function sendBlockingEmail(previousEntry, currentEntry) {
    const recipient = previousEntry.user?.email;
    if (!recipient) return {sent: false, skipped: true};
    if (!await isEmailTemplateEnabled(db, 'latePickupWarning')) return {sent: false, skipped: true};
    if (!await reserveDailyBlockingAlert(recipient, currentEntry, previousEntry)) return {sent: false, skipped: true};

    const smtpConfig = await db.smtpConfig.findFirst({where: {isActive: true}, orderBy: {lastUpdated: 'desc'}});
    if (!smtpConfig) return {sent: false, skipped: true};

    const transporter = nodemailer.createTransport({
        host: decrypt(smtpConfig.host),
        port: parseInt(decrypt(smtpConfig.port), 10),
        secure: smtpConfig.secure,
        auth: {user: decrypt(smtpConfig.username), pass: decrypt(smtpConfig.password)},
        tls: {rejectUnauthorized: false},
    });

    await transporter.sendMail(buildEmailMessage({
        from: `"${decrypt(smtpConfig.fromName)}" <${decrypt(smtpConfig.fromEmail)}>`,
        to: recipient,
        subject: `Ressource attendue - ${currentEntry.resource?.name || 'réservation'}`,
        templateName: 'latePickupWarning',
        data: {
            offender: formatUser(previousEntry.user),
            requester: formatUser(currentEntry.user),
            resource: currentEntry.resource?.name,
            endDate: previousEntry.endDate,
        },
    }));

    return {sent: true, skipped: false};
}

async function upsertBlockingNotification({userId, entryId, title, message}) {
    if (!userId) return;

    await db.notification.upsert({
        where: {userId_type_entryId: {userId, type: 'RESOURCE_PICKUP_BLOCKED', entryId}},
        update: {title, message, readAt: null, deletedAt: null},
        create: {userId, entryId, type: 'RESOURCE_PICKUP_BLOCKED', title, message},
    });
}

export default async function handler(req, res) {
    await runMiddleware(req, res);
    const session = req.method === 'OPTIONS' ? null : await requireAuth(req, res);
    if (req.method !== 'OPTIONS' && !session) return;

    if (req.method === 'OPTIONS') {
        res.setHeader('Allow', ['POST', 'OPTIONS']);
        res.status(204).end();
        return;
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST', 'OPTIONS']);
        return res.status(405).json({message: `Method ${req.method} not allowed`});
    }

    const entryId = Number(req.query.id);
    const currentEntry = await db.entry.findFirst({
        where: {id: entryId, userId: Number(session.user.id), moderate: 'ACCEPTED'},
        include: includeEntry,
    });

    if (!currentEntry) return res.status(404).json({message: 'Réservation introuvable'});
    if (currentEntry.resource?.status !== 'UNAVAILABLE') {
        return res.status(409).json({message: 'La ressource n’est pas bloquée actuellement'});
    }

    const now = new Date();
    const previousEntry = await db.entry.findFirst({
        where: {
            id: {not: currentEntry.id},
            resourceId: currentEntry.resourceId,
            moderate: 'USED',
            returned: false,
            endDate: {lte: now},
        },
        include: {user: true, resource: true},
        orderBy: {endDate: 'desc'},
    });

    if (!previousEntry) return res.status(409).json({message: 'Aucune réservation précédente bloquante trouvée'});

    const owner = getResourceOwner(currentEntry.resource);
    const requester = formatUser(currentEntry.user);
    const offender = formatUser(previousEntry.user);
    const resourceName = currentEntry.resource?.name || 'la ressource';

    const emailResult = await sendBlockingEmail(previousEntry, currentEntry).catch((error) => {
        console.error('Blocking email failed:', error);
        return {sent: false, skipped: true};
    });

    await Promise.all([
        upsertBlockingNotification({
            userId: previousEntry.userId,
            entryId: previousEntry.id,
            title: 'Restitution attendue',
            message: `${requester} attend ${resourceName}. Merci de restituer la ressource dès que possible.`,
        }),
        owner?.id && Number(owner.id) !== Number(session.user.id) ? upsertBlockingNotification({
            userId: owner.id,
            entryId: currentEntry.id,
            title: 'Récupération bloquée',
            message: `${requester} est bloqué car ${offender} n’a pas restitué ${resourceName}.`,
        }) : null,
        createEntryMessage({
            entryId: currentEntry.id,
            userId: session.user.id,
            content: `Signalement automatique : ${requester} ne peut pas récupérer ${resourceName}, car la réservation précédente de ${offender} n’est pas restituée.`,
        }),
    ]);

    return res.status(200).json({message: 'Blocage signalé', emailSent: emailResult.sent});
}
