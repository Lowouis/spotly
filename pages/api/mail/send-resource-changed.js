'use server';
import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";
import nodemailer from 'nodemailer';
import {decrypt} from '@/lib/security';
import {htmlToText} from 'html-to-text';
import {getEmailTemplate} from '@/utils/mails/templates';
import path from 'path';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method === "POST") {
        const {reservationId, oldResourceId, newResourceId, reason} = req.body;

        if (!reservationId || !oldResourceId || !newResourceId || !reason) {
            return res.status(400).json({message: "Paramètres manquants"});
        }

        try {
            // Récupérer les informations de la réservation
            const reservation = await prisma.entry.findUnique({
                where: {id: parseInt(reservationId)},
                include: {
                    user: true,
                    resource: {
                        include: {
                            domains: true,
                            category: true
                        }
                    }
                }
            });

            if (!reservation) {
                return res.status(404).json({message: "Réservation non trouvée"});
            }

            // Récupérer les informations de l'ancienne ressource
            const oldResource = await prisma.resource.findUnique({
                where: {id: parseInt(oldResourceId)},
                include: {
                    domains: true,
                    category: true
                }
            });

            if (!oldResource) {
                return res.status(404).json({message: "Ancienne ressource non trouvée"});
            }

            // Envoyer l'email de notification
            if (reservation.user?.email) {
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

                const transporter = nodemailer.createTransporter({
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

                const emailData = {
                    userName: `${reservation.user.name} ${reservation.user.surname}`,
                    oldResourceName: oldResource.name,
                    newResourceName: reservation.resource.name,
                    newResourceSite: reservation.resource.domains?.name || 'Site inconnu',
                    newResourceCategory: reservation.resource.category?.name || 'Catégorie inconnue',
                    reservationStartDate: new Date(reservation.startDate).toLocaleString("fr-FR"),
                    reservationEndDate: new Date(reservation.endDate).toLocaleString("fr-FR"),
                    reason: reason,
                    adminContact: process.env.ADMIN_EMAIL || 'admin@example.com'
                };

                const htmlContent = getEmailTemplate('resourceChanged', emailData);
                const textContent = htmlToText(htmlContent, {wordwrap: 130});

                await transporter.sendMail({
                    headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                    },
                    from: `"${decrypt(smtpConfig.fromName)}" <${decrypt(smtpConfig.fromEmail)}>`,
                    to: reservation.user.email,
                    subject: `Changement de ressource - Réservation modifiée`,
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

            return res.status(200).json({
                message: "Email de notification envoyé avec succès"
            });
        } catch (error) {
            console.error("Erreur lors de l'envoi de l'email:", error);
            return res.status(500).json({message: "Erreur lors de l'envoi de l'email", error: error.message});
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).json({message: `Method ${req.method} not allowed`});
    }
}
