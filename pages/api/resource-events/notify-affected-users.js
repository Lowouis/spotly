import nodemailer from 'nodemailer';
import db from '@/server/services/databaseService';
import {runMiddleware} from '@/services/server/core';
import {requireAdmin} from '@/services/server/api-auth';
import {decrypt} from '@/services/server/security';
import {buildEmailMessage} from '@/services/server/mails/mailer';
import {isEmailTemplateEnabled} from '@/services/server/mails/settings';
import {findAffectedReservations} from '@/services/server/resource-event-impact';

function formatUser(user, fallback = 'Utilisateur') {
    return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.email || fallback;
}

function formatReservationDate(value) {
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

async function getTransporter() {
    const smtpConfig = await db.smtpConfig.findFirst({
        where: {isActive: true},
        orderBy: {lastUpdated: 'desc'},
    });
    if (!smtpConfig) return null;

    return {
        from: `"${decrypt(smtpConfig.fromName)}" <${decrypt(smtpConfig.fromEmail)}>`,
        transporter: nodemailer.createTransport({
            host: decrypt(smtpConfig.host),
            port: parseInt(decrypt(smtpConfig.port), 10),
            secure: smtpConfig.secure,
            auth: {
                user: decrypt(smtpConfig.username),
                pass: decrypt(smtpConfig.password),
            },
            tls: {rejectUnauthorized: false},
        }),
    };
}

export default async function handler(req, res) {
    await runMiddleware(req, res);
    if (!await requireAdmin(req, res)) return;

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({message: `Method ${req.method} not allowed`});
    }

    const resourceId = Number(req.body?.resourceId);
    const startDate = req.body?.startDate ? new Date(req.body.startDate) : null;
    const endDate = req.body?.endDate ? new Date(req.body.endDate) : null;
    const eventTitle = String(req.body?.eventTitle || '').trim() || 'Indisponibilité temporaire';
    const eventType = String(req.body?.eventType || '').trim() || 'Maintenance';
    const eventDescription = String(req.body?.eventDescription || '').trim() || 'Aucun détail complémentaire.';

    if (!resourceId || !startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return res.status(400).json({message: 'resourceId, startDate et endDate sont obligatoires'});
    }
    if (endDate < startDate) {
        return res.status(400).json({message: 'La date de fin doit être postérieure à la date de début'});
    }

    const resource = await db.resource.findUnique({
        where: {id: resourceId},
        include: {
            domains: true,
            category: true,
        },
    });
    if (!resource) return res.status(404).json({message: 'Ressource introuvable'});

    const affectedReservations = await findAffectedReservations(db, {resourceId, startDate, endDate});
    if (!affectedReservations.length) {
        return res.status(200).json({
            message: 'Aucune réservation concernée.',
            notificationCount: 0,
            emailCount: 0,
        });
    }

    const notificationTitle = 'Changement de ressource à prévoir';
    await Promise.all(affectedReservations.map((reservation) => db.notification.upsert({
        where: {
            userId_type_entryId: {
                userId: reservation.userId,
                type: 'RESOURCE_PROBLEM_REPORTED',
                entryId: reservation.id,
            },
        },
        update: {
            title: notificationTitle,
            message: `${eventType} sur ${resource.name} : ${eventTitle}. Votre réservation du ${formatReservationDate(reservation.startDate)} devra être déplacée sur une autre ressource.`,
            readAt: null,
            deletedAt: null,
        },
        create: {
            userId: reservation.userId,
            entryId: reservation.id,
            type: 'RESOURCE_PROBLEM_REPORTED',
            title: notificationTitle,
            message: `${eventType} sur ${resource.name} : ${eventTitle}. Votre réservation du ${formatReservationDate(reservation.startDate)} devra être déplacée sur une autre ressource.`,
        },
    })));

    const templateEnabled = await isEmailTemplateEnabled(db, 'resourceEventAffectedReservation');
    let emailCount = 0;
    let emailSkipped = !templateEnabled;

    if (templateEnabled) {
        try {
            const smtp = await getTransporter();
            if (!smtp) {
                emailSkipped = true;
            } else {
                const emailableReservations = affectedReservations.filter((reservation) => reservation.user?.email);
                await Promise.all(emailableReservations.map((reservation) => smtp.transporter.sendMail(buildEmailMessage({
                    from: smtp.from,
                    to: reservation.user.email,
                    subject: `Changement de ressource requis - ${resource.name}`,
                    templateName: 'resourceEventAffectedReservation',
                    data: {
                        userName: formatUser(reservation.user),
                        resourceName: resource.name,
                        resourceCategory: resource.category?.name || 'Catégorie inconnue',
                        resourceSite: resource.domains?.name || 'Site inconnu',
                        reservationStartDate: reservation.startDate,
                        reservationEndDate: reservation.endDate,
                        eventType,
                        eventReason: eventTitle,
                        eventDescription,
                        adminContact: process.env.ADMIN_EMAIL || 'admin@example.com',
                    },
                }))));
                emailCount = emailableReservations.length;
                emailSkipped = false;
            }
        } catch (error) {
            console.error('Failed to send affected reservation emails:', error);
            emailSkipped = true;
        }
    }

    return res.status(200).json({
        message: 'Utilisateurs prévenus.',
        notificationCount: affectedReservations.length,
        emailCount,
        emailSkipped,
    });
}
