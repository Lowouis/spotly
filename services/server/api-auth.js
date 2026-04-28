import {getServerSession} from 'next-auth/next';
import {authConfig} from '@/pages/api/auth/[...nextauth]';

const rateLimitStore = new Map();

export async function getApiSession(req, res) {
    return getServerSession(req, res, authConfig);
}

export async function requireAuth(req, res) {
    const session = await getApiSession(req, res);
    if (!session?.user?.id) {
        res.status(401).json({message: 'Non autorisé'});
        return null;
    }
    return session;
}

export async function requireAdmin(req, res) {
    const session = await requireAuth(req, res);
    if (!session) return null;

    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
        res.status(403).json({message: 'Accès interdit'});
        return null;
    }

    return session;
}

export function isAdminSession(session) {
    return ['ADMIN', 'SUPERADMIN'].includes(session?.user?.role);
}

export function isSameUser(session, userId) {
    return Number(session?.user?.id) === Number(userId);
}

export function rateLimit(req, res, {key = 'default', limit = 20, windowMs = 60_000} = {}) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded?.split(',')[0] || req.socket?.remoteAddress || 'unknown');
    const bucketKey = `${key}:${ip}`;
    const now = Date.now();
    const bucket = rateLimitStore.get(bucketKey) || {count: 0, resetAt: now + windowMs};

    if (bucket.resetAt <= now) {
        bucket.count = 0;
        bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    rateLimitStore.set(bucketKey, bucket);

    if (bucket.count > limit) {
        res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
        res.status(429).json({message: 'Trop de requêtes, veuillez réessayer plus tard'});
        return false;
    }

    return true;
}

export function resetRateLimitStore() {
    rateLimitStore.clear();
}
