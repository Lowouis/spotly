import db from '@/server/services/databaseService';

export function normalizeClientIp(value) {
    const rawIp = Array.isArray(value) ? value[0] : String(value || '').split(',')[0].trim();
    if (!rawIp) return null;
    if (rawIp.startsWith('::ffff:')) return rawIp.slice(7);
    if (rawIp === '::1') return '127.0.0.1';
    return rawIp;
}

export function getClientIp(req) {
    return normalizeClientIp(
        req.headers['x-forwarded-for']
        || req.headers['x-real-ip']
        || req.connection?.remoteAddress
        || req.socket?.remoteAddress
        || req.connection?.socket?.remoteAddress
    );
}

export async function getAuthorizedLocationForRequest(req) {
    const ip = getClientIp(req);
    if (!ip) return {ip: null, authorizedLocation: null};

    const authorizedLocation = await db.authorizedLocation.findFirst({where: {ip}});
    return {ip, authorizedLocation};
}
