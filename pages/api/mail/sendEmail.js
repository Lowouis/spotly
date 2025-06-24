'use server';

import nodemailer from 'nodemailer';
import {runMiddleware} from "@/lib/core";
import {marked} from 'marked';
import prisma from "@/prismaconf/init";
import {decrypt} from '@/lib/security';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        return res.status(405).json({message: 'Method not allowed'});
    }
    const {to, subject, text} = req.body;

    // Convertir le Markdown en HTML
    const htmlContent = marked(text);

    try {
        // Récupérer la configuration SMTP active
        const smtpConfig = await prisma.smtpConfig.findFirst({
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
            },
        });

        const info = await transporter.sendMail({
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
            from: `"${decrypt(smtpConfig.fromName)}" <${decrypt(smtpConfig.fromEmail)}>`,
            to,
            subject,
            text: text, // Version texte brut (Markdown)
            html: htmlContent, // Version HTML convertie
        });

        return res.status(200).json({message: 'Email sent successfully!', info});
    } catch (error) {
        console.error('Email sending error:', error);
        return res.status(500).json({
            message: 'Failed to send email',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur lors de l\'envoi de l\'email'
        });
    }
}
