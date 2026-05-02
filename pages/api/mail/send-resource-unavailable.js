'use server';
import db from "@/server/services/databaseService";
import {runMiddleware} from "@/services/server/core";
import nodemailer from 'nodemailer';
import {decrypt} from '@/services/server/security';
import {htmlToText} from 'html-to-text';
import {getEmailTemplate} from '@/services/server/mails/templates';
import path from 'path';
import {requireAdmin} from '@/services/server/api-auth';
import {isEmailTemplateEnabled} from '@/services/server/mails/settings';

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (!await requireAdmin(req, res)) return;

    if (req.method === "POST") {
        const {resourceId, message, affectedReservations} = req.body;

        if (!resourceId || !message || !affectedReservations) {
            return res.status(400).json({message: "Paramètres manquants"});
        }

        try {
            const templateEnabled = await isEmailTemplateEnabled(db, 'resourceUnavailable');
            if (!templateEnabled) {
                return res.status(200).json({
                    message: "Email désactivé par la configuration mail",
                    skipped: true,
                    disabledByConfig: true,
                    sentCount: 0,
                });
            }

            // Récupérer les informations de la ressource
            const resource = await db.resource.findUnique({
                where: {id: parseInt(resourceId)},
                include: {
                    domains: true,
                    category: true
                }
            });

            if (!resource) {
                return res.status(404).json({message: "Ressource non trouvée"});
            }

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
                charset: 'utf-8',
                encoding: 'utf-8'
            });

            // Envoyer un email à chaque utilisateur affecté
            const emailPromises = affectedReservations.map(async (reservation) => {
                if (reservation.user?.email) {
                    const emailData = {
                        userName: `${reservation.user.name} ${reservation.user.surname}`,
                        resourceName: resource.name,
                        resourceCategory: resource.category?.name || 'Catégorie inconnue',
                        resourceSite: resource.domains?.name || 'Site inconnu',
                        reservationStartDate: new Date(reservation.startDate).toLocaleString("fr-FR"),
                        reservationEndDate: new Date(reservation.endDate).toLocaleString("fr-FR"),
                        message: message,
                        adminContact: process.env.ADMIN_EMAIL || 'admin@example.com'
                    };

                    const htmlContent = getEmailTemplate('resourceUnavailable', emailData);
                    const textContent = htmlToText(htmlContent, {wordwrap: 130});

                    return transporter.sendMail({
                        headers: {
                            'Content-Type': 'text/html; charset=utf-8',
                        },
                        from: `"${decrypt(smtpConfig.fromName)}" <${decrypt(smtpConfig.fromEmail)}>`,
                        to: reservation.user.email,
                        subject: `Ressource "${resource.name}" indisponible - Réservation affectée`,
                        html: htmlContent,
                        text: textContent,
                        encoding: 'utf-8',
                        attachments: [
                            {
                                filename: 'banner_low.png',
                                path: path.resolve(process.cwd(), 'public/banner_low.png'),
                                cid: 'bannerimg'
                            }
                        ]
                    });
                }
                return null;
            });

            await Promise.all(emailPromises.filter(Boolean));

            return res.status(200).json({
                message: "Emails de notification envoyés avec succès",
                sentCount: affectedReservations.length
            });
        } catch (error) {
            console.error("Erreur lors de l'envoi des emails:", error);
            return res.status(500).json({
                message: "Erreur lors de l'envoi des emails"
            });
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).json({message: `Method ${req.method} not allowed`});
    }
}
