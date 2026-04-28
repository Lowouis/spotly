import nodemailer from 'nodemailer';
import db from '@/server/services/databaseService';
import {decrypt} from '@/services/server/security';
import {buildEmailMessage} from './mailer';

global.setImmediate ||= (callback, ...args) => setTimeout(callback, 0, ...args);

const runMailSmoke = process.env.SEND_MAIL_SMOKE === '1';
const describeMailSmoke = runMailSmoke ? describe : describe.skip;

const recipient = process.env.MAIL_SMOKE_TO || 'admin@admin.fr';

const baseEntry = {
    id: 1001,
    startDate: '2026-04-28T20:00:00.000Z',
    endDate: '2026-04-29T14:00:00.000Z',
    returnedConfirmationCode: '402647',
    isCode: true,
    comment: 'Commentaire utilisateur de test',
    adminNote: 'Note administrateur de test',
};

const templateCases = [
    {
        templateName: 'test',
        subject: '[Spotly smoke] Test email',
        data: {},
    },
    {
        templateName: 'rejected',
        subject: '[Spotly smoke] Refus reservation',
        data: {
            name: 'Nadia Robert',
            resource: 'Ressource Test 1',
            domain: 'Site Test',
            owner: 'Admin Spotly',
            startDate: baseEntry.startDate,
            endDate: baseEntry.endDate,
        },
    },
    {
        templateName: 'reservationConfirmation',
        subject: '[Spotly smoke] Confirmation reservation',
        data: {
            name: 'Nadia Robert',
            resource: 'Ressource Test 2',
            domain: 'Site Test',
            startDate: baseEntry.startDate,
            endDate: baseEntry.endDate,
            comment: baseEntry.comment,
        },
    },
    {
        templateName: 'reservationCancelled',
        subject: '[Spotly smoke] Annulation reservation',
        data: {
            user: 'Nadia Robert',
            resource: 'Ressource Test 2',
            startDate: baseEntry.startDate,
            endDate: baseEntry.endDate,
        },
    },
    {
        templateName: 'reservationRequestUser',
        subject: '[Spotly smoke] Demande reservation soumise',
        data: {
            name: 'Nadia Robert',
            resource: 'Ressource Test 3',
            domain: 'Site Test',
            owner: 'Admin Spotly',
            startDate: baseEntry.startDate,
            endDate: baseEntry.endDate,
            comment: baseEntry.comment,
        },
    },
    {
        templateName: 'reservationRequestOwner',
        subject: '[Spotly smoke] Demande d\'autorisation de reservation',
        data: {
            user: 'Nadia Robert',
            resource: 'Ressource Test 3',
            domain: 'Site Test',
            startDate: baseEntry.startDate,
            endDate: baseEntry.endDate,
            comment: baseEntry.comment,
        },
    },
    {
        templateName: 'reservationReturnedConfirmation',
        subject: '[Spotly smoke] Confirmation restitution',
        data: {
            entryId: baseEntry.id,
            resource: {id: 3, name: 'Ressource Test 3'},
            endDate: baseEntry.endDate,
            returnedAt: '2026-04-29T14:10:00.000Z',
        },
    },
    {
        templateName: 'reservationDelayedAlert',
        subject: '[Spotly smoke] Retard restitution',
        data: {
            entryId: baseEntry.id,
            resource: {id: 3, name: 'Ressource Test 3'},
            endDate: '2026-04-28T10:00:00.000Z',
        },
    },
    {
        templateName: 'latePickupWarning',
        subject: '[Spotly smoke] Alerte retard pickup',
        data: {
            offender: 'Nadia Robert',
            requester: 'Alice Martin',
            resource: 'Ressource Test 3',
            endDate: '2026-04-28T10:00:00.000Z',
        },
    },
    {
        templateName: 'resentCode',
        subject: '[Spotly smoke] Code reservation',
        data: {
            entryId: baseEntry.id,
            user: 'Nadia Robert',
            resource: 'Ressource Test 3',
            startDate: baseEntry.startDate,
            endDate: baseEntry.endDate,
            key: baseEntry.returnedConfirmationCode,
        },
    },
    {
        templateName: 'groupReservationAccepted',
        subject: '[Spotly smoke] Groupe accepte',
        data: {
            user: 'Nadia Robert',
            resource: 'Ressource Test 3',
            entries: [
                {...baseEntry, id: 1001},
                {...baseEntry, id: 1002, startDate: '2026-04-30T09:00:00.000Z', endDate: '2026-04-30T12:00:00.000Z'},
            ],
        },
    },
    {
        templateName: 'groupReservationWaiting',
        subject: '[Spotly smoke] Groupe en attente',
        data: {
            user: 'Nadia Robert',
            resource: 'Ressource Test 3',
            entries: [baseEntry],
        },
    },
    {
        templateName: 'groupReservationCancelled',
        subject: '[Spotly smoke] Groupe annule',
        data: {
            user: 'Nadia Robert',
            resource: 'Ressource Test 3',
            entries: [baseEntry],
        },
    },
    {
        templateName: 'groupReservationRequestOwner',
        subject: '[Spotly smoke] Groupe demande proprietaire',
        data: {
            user: 'Nadia Robert',
            resource: 'Ressource Test 3',
            entries: [baseEntry],
        },
    },
    {
        templateName: 'resourceUnavailable',
        subject: '[Spotly smoke] Ressource indisponible',
        data: {
            userName: 'Nadia Robert',
            resourceName: 'Ressource Test 4',
            resourceCategory: 'Categorie Test',
            resourceSite: 'Site Test',
            reservationStartDate: baseEntry.startDate,
            reservationEndDate: baseEntry.endDate,
            message: 'Maintenance de test',
            adminContact: 'admin@admin.fr',
        },
    },
    {
        templateName: 'resourceChanged',
        subject: '[Spotly smoke] Ressource modifiee',
        data: {
            userName: 'Nadia Robert',
            oldResourceName: 'Ancienne Ressource',
            newResourceName: 'Nouvelle Ressource',
            newResourceSite: 'Site Test',
            newResourceCategory: 'Categorie Test',
            reservationStartDate: baseEntry.startDate,
            reservationEndDate: baseEntry.endDate,
            adminContact: 'admin@admin.fr',
        },
    },
];

async function createTransportFromActiveConfig() {
    const smtpConfig = await db.smtpConfig.findFirst({
        where: {isActive: true},
        orderBy: {lastUpdated: 'desc'},
    });

    if (!smtpConfig) {
        throw new Error('Aucune configuration SMTP active trouvee. Configure SMTP avant de lancer ce test.');
    }

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

describeMailSmoke('send all mail templates to catcher', () => {
    let transporter;
    let from;

    beforeAll(async () => {
        const smtp = await createTransportFromActiveConfig();
        transporter = smtp.transporter;
        from = smtp.from;
    });

    afterAll(async () => {
        await db.$disconnect?.();
    });

    it.each(templateCases)('sends $templateName to mail catcher', async ({templateName, subject, data}) => {
        const info = await transporter.sendMail(buildEmailMessage({
            from,
            to: recipient,
            subject,
            templateName,
            data,
        }));

        expect(info.accepted).toContain(recipient);
    }, 15000);
});
