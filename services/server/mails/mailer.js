import {htmlToText} from 'html-to-text';
import {getEmailTemplate} from '@/services/server/mails/templates';

export function encodeHtmlEntities(value) {
    return String(value).replace(/[\u0080-\uFFFF]/g, (char) => `&#${char.charCodeAt(0)};`);
}

function sanitizeHeader(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/[\r\n]+/g, ' ')
        .trim();
}

function buildRawHtmlEmail({from, to, subject, html}) {
    const safeFrom = sanitizeHeader(from);
    const safeTo = sanitizeHeader(to);
    const safeSubject = sanitizeHeader(subject);

    return Buffer.from([
        `From: ${safeFrom}`,
        `To: ${safeTo}`,
        `Subject: ${safeSubject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 7bit',
        'X-Auto-Response-Suppress: All',
        '',
        html,
    ].join('\r\n'), 'ascii');
}

export function buildEmailMessage({from, to, subject, templateName, data}) {
    const html = encodeHtmlEntities(getEmailTemplate(templateName, {...data, subject}));
    const text = htmlToText(html, {wordwrap: 130});

    return {
        envelope: {from, to},
        raw: buildRawHtmlEmail({from, to, subject, html}),
        html,
        text,
    };
}

export function notificationDateKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

export function buildNotificationContextKey({templateName, to, data = {}}) {
    const entryId = data.entryId || data.id || data.entry?.id;
    const resourceId = data.resourceId || data.resource?.id;

    if (entryId) return `entry:${entryId}`;
    if (resourceId) return `resource:${resourceId}`;
    return `${templateName}:${to}`;
}

export async function shouldSendDailyNotification(db, {templateName, to, data, date = new Date()}) {
    if (!['reservationDelayedAlert'].includes(templateName)) {
        return {allowed: true, contextKey: null, dateKey: null};
    }

    const dateKey = notificationDateKey(date);
    const contextKey = buildNotificationContextKey({templateName, to, data});

    try {
        await db.emailNotificationLog.create({
            data: {
                templateName,
                recipient: to,
                contextKey,
                dateKey,
            }
        });
        return {allowed: true, contextKey, dateKey};
    } catch (error) {
        if (error?.code === 'P2002') {
            return {allowed: false, contextKey, dateKey};
        }
        throw error;
    }
}
