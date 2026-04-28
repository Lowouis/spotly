'use server';
import nodemailer from 'nodemailer';
import {runMiddleware} from "@/services/server/core";
import db from "@/server/services/databaseService";
import {decrypt} from '@/services/server/security';
import {buildEmailMessage, shouldSendDailyNotification} from '@/services/server/mails/mailer';
import {rateLimit, requireAuth} from '@/services/server/api-auth';

function isAuthorizedServiceRequest(req) {
    const expectedSecret = process.env.CRON_SECRET;
    const authorization = req.headers.authorization || '';

    return Boolean(expectedSecret) && authorization === `Bearer ${expectedSecret}`;
}

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method === 'OPTIONS') {
        return res.status(200).json({message: 'OK'});
    }
    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        return res.status(405).json({message: 'Method not allowed'});
    }
    if (!rateLimit(req, res, {key: 'mail:send', limit: 30, windowMs: 60_000})) return;
    if (!isAuthorizedServiceRequest(req) && !await requireAuth(req, res)) return;
    const {to, subject, templateName, data} = req.body;

    if (!to || !subject || !templateName || !data) {
        return res.status(400).json({message: 'to, subject, templateName et data sont obligatoires'});
    }

    try {
        // Récupérer la configuration SMTP active
        const smtpConfig = await db.smtpConfig.findFirst({
            where: {
                isActive: true
            },
            orderBy: {
                lastUpdated: 'desc'
            }
        });

        if (!smtpConfig) {
            throw new Error('Aucune configuration SMTP active trouvée');
        }

        const delivery = await shouldSendDailyNotification(db, {templateName, to, data});
        if (!delivery.allowed) {
            return res.status(200).json({
                message: 'Email already sent for this notification today.',
                skipped: true,
                contextKey: delivery.contextKey,
                dateKey: delivery.dateKey,
            });
        }

        // Décrypter les données sensibles
        const decryptedConfig = {
            host: decrypt(smtpConfig.host),
            port: decrypt(smtpConfig.port),
            username: decrypt(smtpConfig.username),
            password: decrypt(smtpConfig.password),
            secure: smtpConfig.secure
        };

        const transporter = nodemailer.createTransport({
            host: decryptedConfig.host,
            port: parseInt(decryptedConfig.port),
            secure: decryptedConfig.secure,
            auth: {
                user: decryptedConfig.username,
                pass: decryptedConfig.password
            },
            tls: {
                rejectUnauthorized: false,
            }
        });

        const info = await transporter.sendMail(buildEmailMessage({
            from: `"${decrypt(smtpConfig.fromName)}" <${decrypt(smtpConfig.fromEmail)}>`,
            to,
            subject,
            templateName,
            data,
        }));

        return res.status(200).json({message: 'Email sent successfully!', info});
    } catch (error) {
        console.error('Email sending error:', error);
        return res.status(500).json({
            message: 'Failed to send email',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur lors de l\'envoi de l\'email'
        });
    }
}
