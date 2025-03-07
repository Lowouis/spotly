'use server';

import nodemailer from 'nodemailer';
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    const { to, subject, text } = req.body;

    const transporter = nodemailer.createTransport({
        host: process.env.NEXT_PUBLIC_SMTP_HOST || 'bluemind',
        port: process.env.NEXT_PUBLIC_SMTP_PORT || 25,
        secure: process.env.NEXT_PUBLIC_SMTP_SECURE === 'true',
        auth: null,
        tls: {
            rejectUnauthorized: false,
        },
    });


    try {
        const info = await transporter.sendMail({
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            },
            from: process.env.NEXT_PUBLIC_EMAIL_USER,
            to  ,
            subject,
            text,

        });

        return res.status(200).json({ message: 'Email sent successfully!', info });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to send email', error });
    }
}
