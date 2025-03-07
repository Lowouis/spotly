import nodemailer from 'nodemailer';
import { runMiddleware } from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { smtpConfig, user} = req.body;
    console.log(smtpConfig);
    const transporter = nodemailer.createTransport({
        ...smtpConfig,
        auth: null,
        tls: {
            rejectUnauthorized: false, // Allow self-signed certificates
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.NEXT_PUBLIC_EMAIL_USER,
            to: user, // Envoi à soi-même pour le test
            subject: 'Test SMTP',
            text: 'Ceci est un email de test pour vérifier la connexion au serveur SMTP.',
        });

        return res.status(200).json({ message: 'SMTP server is responding correctly!', info });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to connect to SMTP server', error });
    }
}