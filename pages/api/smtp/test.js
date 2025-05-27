import {validateSmtpConfig} from '@/lib/smtp-utils';
import {runMiddleware} from "@/lib/core";
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const {host, port, username, password, secure} = req.body;
    if (!host || !port || !username || !password) {
        return res.status(400).json({message: 'Tous les champs sont requis'});
    }

    try {
        // 1. Validation de la configuration
        const config = {
            host,
            port,
            username,
            password,
            secure: secure ?? true
        };

        const validationResult = await validateSmtpConfig(config);
        if (!validationResult.success) {
            return res.status(401).json({
                message: 'Configuration SMTP invalide',
                details: validationResult.error
            });
        }

        // 2. Test de connexion
        const transporter = nodemailer.createTransport({
            host,
            port: parseInt(port),
            secure: secure ?? true,
            auth: {
                user: username,
                pass: password
            }
        });

        await transporter.verify();

        return res.status(200).json({
            message: 'Connexion SMTP réussie'
        });

    } catch (error) {
        console.error('SMTP connection test error:', error);
        return res.status(500).json({
            message: 'Erreur lors du test de connexion',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
} 