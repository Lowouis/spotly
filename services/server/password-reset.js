import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import db from '@/server/services/databaseService';
import {decrypt} from '@/services/server/security';
import {buildEmailMessage} from '@/services/server/mails/mailer';
import {publicEnv} from '@/config/publicEnv';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 15 * 60 * 1000;
const RESET_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RESET_RATE_LIMIT_MAX = 5;
const GENERIC_RESPONSE = 'Si un compte interne existe pour cet identifiant, un email de récupération va être envoyé.';

const resetAttempts = new Map();

function normalizeIdentifier(identifier) {
    return String(identifier || '').trim().toLowerCase();
}

function getRequestIp(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) return forwardedFor.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

function isAllowedOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return true;

    const expected = process.env.NEXTAUTH_URL;
    if (!expected) return true;

    try {
        return new URL(origin).origin === new URL(expected).origin;
    } catch {
        return false;
    }
}

function assertResetRateLimit(req, identifier) {
    const key = `${getRequestIp(req)}:${identifier}`;
    const now = Date.now();
    const bucket = resetAttempts.get(key) || {count: 0, resetAt: now + RESET_RATE_LIMIT_WINDOW_MS};

    if (bucket.resetAt <= now) {
        bucket.count = 0;
        bucket.resetAt = now + RESET_RATE_LIMIT_WINDOW_MS;
    }

    bucket.count += 1;
    resetAttempts.set(key, bucket);

    return bucket.count <= RESET_RATE_LIMIT_MAX;
}

function passwordValidationError(password) {
    if (typeof password !== 'string' || password.length < 12) {
        return 'Le mot de passe doit contenir au moins 12 caractères.';
    }
    if (password.length > 128) {
        return 'Le mot de passe ne doit pas dépasser 128 caractères.';
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre.';
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        return 'Le mot de passe doit contenir au moins un caractère spécial.';
    }
    return null;
}

async function sendPasswordResetEmail({user, token, req}) {
    const smtpConfig = await db.smtpConfig.findFirst({
        where: {isActive: true},
        orderBy: {lastUpdated: 'desc'},
    });

    if (!smtpConfig) throw new Error('Aucune configuration SMTP active trouvée');

    const appUrl = process.env.NEXTAUTH_URL || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    const resetUrl = new URL(`${publicEnv.basePath}/reset-password`, appUrl);
    resetUrl.searchParams.set('token', token);

    const transporter = nodemailer.createTransport({
        host: decrypt(smtpConfig.host),
        port: parseInt(decrypt(smtpConfig.port), 10),
        secure: smtpConfig.secure,
        auth: {
            user: decrypt(smtpConfig.username),
            pass: decrypt(smtpConfig.password),
        },
        tls: {rejectUnauthorized: false},
    });

    await transporter.sendMail(buildEmailMessage({
        from: `"${decrypt(smtpConfig.fromName)}" <${decrypt(smtpConfig.fromEmail)}>`,
        to: user.email,
        subject: 'Récupération de votre mot de passe Spotly',
        templateName: 'passwordReset',
        data: {
            user,
            resetUrl: resetUrl.toString(),
            expiresInMinutes: Math.round(TOKEN_TTL_MS / 60_000),
        },
    }));
}

export async function requestPasswordReset(req) {
    if (!isAllowedOrigin(req)) {
        return {status: 403, body: {message: 'Origine non autorisée'}};
    }

    const identifier = normalizeIdentifier(req.body?.identifier);
    if (!identifier) {
        return {status: 200, body: {message: GENERIC_RESPONSE}};
    }
    if (!assertResetRateLimit(req, identifier)) {
        return {status: 429, body: {message: 'Trop de demandes. Veuillez réessayer plus tard.'}};
    }

    const user = await db.user.findFirst({
        where: {
            external: false,
            email: {not: null},
            password: {not: null},
            OR: [
                {email: identifier},
                {username: identifier},
            ],
        },
    });

    if (!user?.email) {
        return {status: 200, body: {message: GENERIC_RESPONSE}};
    }

    const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
    const now = new Date();

    await db.$transaction([
        db.passwordResetToken.updateMany({
            where: {userId: user.id, usedAt: null},
            data: {usedAt: now},
        }),
        db.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash: hashToken(token),
                expiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
            },
        }),
    ]);

    try {
        await sendPasswordResetEmail({user, token, req});
    } catch (error) {
        console.error('Password reset email failed:', error);
    }

    return {status: 200, body: {message: GENERIC_RESPONSE}};
}

export async function confirmPasswordReset(req) {
    if (!isAllowedOrigin(req)) {
        return {status: 403, body: {message: 'Origine non autorisée'}};
    }

    const token = String(req.body?.token || '').trim();
    const password = req.body?.password;
    const validationError = passwordValidationError(password);

    if (!token || validationError) {
        return {status: 400, body: {message: validationError || 'Lien de récupération invalide.'}};
    }

    const resetToken = await db.passwordResetToken.findUnique({
        where: {tokenHash: hashToken(token)},
        include: {user: true},
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date() || resetToken.user.external) {
        return {status: 400, body: {message: 'Ce lien de récupération est invalide ou expiré.'}};
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();

    await db.$transaction([
        db.user.update({
            where: {id: resetToken.userId},
            data: {password: hashedPassword},
        }),
        db.passwordResetToken.updateMany({
            where: {userId: resetToken.userId, usedAt: null},
            data: {usedAt: now},
        }),
        db.session.deleteMany({where: {userId: resetToken.userId}}),
    ]);

    return {status: 200, body: {message: 'Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.'}};
}
