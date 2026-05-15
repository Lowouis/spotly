import db from '@/server/services/databaseService';
import {rateLimit} from '@/services/server/api-auth';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed'});
    }
    if (!rateLimit(req, res, {key: 'auth:register-availability', limit: 60, windowMs: 60_000})) return;

    const username = String(req.query.username || '').trim();
    const email = String(req.query.email || '').trim().toLowerCase();

    if (!username && !email) {
        return res.status(400).json({message: 'Nom d\'utilisateur ou email requis'});
    }

    const checks = {};

    if (username) {
        const existingUsername = await db.user.findFirst({where: {username}, select: {id: true}});
        checks.username = {available: !existingUsername};
    }

    if (email) {
        if (!EMAIL_REGEX.test(email)) {
            checks.email = {available: false, valid: false};
            return res.status(200).json(checks);
        }

        const existingEmail = await db.user.findFirst({where: {email}, select: {id: true}});
        checks.email = {available: !existingEmail, valid: true};
    }

    return res.status(200).json(checks);
}
