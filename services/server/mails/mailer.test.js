import nodemailer from 'nodemailer';
import {simpleParser} from 'mailparser';
import {
    buildEmailMessage,
    buildNotificationContextKey,
    encodeHtmlEntities,
    shouldSendDailyNotification
} from './mailer';

global.setImmediate ||= (callback, ...args) => setTimeout(callback, 0, ...args);

describe('mail rendering and delivery safeguards', () => {
    it('builds an email parseable by common mail clients', async () => {
        const transporter = nodemailer.createTransport({
            streamTransport: true,
            buffer: true,
            newline: 'unix',
        });

        const info = await transporter.sendMail(buildEmailMessage({
            from: 'Spotly <spotly@example.test>',
            to: 'nadia@example.test',
            subject: 'Confirmation de réservation',
            templateName: 'reservationConfirmation',
            data: {
                name: 'Nadia Robert',
                resource: {name: 'Ressource Test 2'},
                domain: {name: 'Site Test'},
                startDate: '2026-04-28T20:00:00.000Z',
                endDate: '2026-04-29T21:00:00.000Z',
            },
        }));

        const parsed = await simpleParser(info.message);

        expect(parsed.subject).toBe('Confirmation de reservation');
        expect(parsed.html).toContain('Ressource Test 2');
        expect(parsed.html).toContain('Site Test');
        expect(info.message.toString('ascii')).toContain('Content-Transfer-Encoding: 7bit');
        expect(parsed.html).not.toContain('[object Object]');
        expect(parsed.html).not.toContain('undefined');
        expect(parsed.html).not.toContain('Content-Transfer-Encoding');
        expect(parsed.attachments).toHaveLength(0);
    });

    it('keeps HTML ascii-safe to avoid broken quoted-printable rendering', async () => {
        const transporter = nodemailer.createTransport({
            streamTransport: true,
            buffer: true,
            newline: 'unix',
        });

        const info = await transporter.sendMail(buildEmailMessage({
            from: 'Spotly <spotly@example.test>',
            to: 'nadia@example.test',
            subject: 'Confirmation de réservation',
            templateName: 'reservationConfirmation',
            data: {
                name: 'Nadia Robert',
                resource: 'Ressource Test 3',
                domain: 'Site Test',
                startDate: '2026-04-28T20:00:00.000Z',
                endDate: '2026-04-29T14:00:00.000Z',
            },
        }));

        const raw = info.message.toString('utf8');

        expect(encodeHtmlEntities('réservation')).toBe('r&#233;servation');
        expect(raw).not.toContain('r=C3=A9servation');
        expect(raw).not.toContain('=C3=');
        expect(raw).not.toContain('multipart/alternative');
        expect(raw).not.toContain('multipart/related');
        expect(raw).not.toContain('cid:bannerimg');
        expect(raw).toContain('Content-Transfer-Encoding: 7bit');
    });

    it('uses reservation entry id as daily notification context', () => {
        expect(buildNotificationContextKey({
            templateName: 'resentCode',
            to: 'nadia@example.test',
            data: {entryId: 42}
        })).toBe('entry:42');
    });

    it.each([
        ['resentCode', {entryId: 42, user: 'Nadia Robert', resource: {name: 'Ressource Test 2'}, key: '123456'}],
        ['reservationDelayedAlert', {entryId: 42, resource: {name: 'Ressource Test 2'}, endDate: '2026-04-28T20:00:00.000Z'}],
        ['reservationReturnedConfirmation', {entryId: 42, resource: {name: 'Ressource Test 2'}, endDate: '2026-04-28T20:00:00.000Z'}],
        ['latePickupWarning', {offender: 'Nadia Robert', requester: 'Alice Martin', resource: 'Ressource Test 2', endDate: '2026-04-28T20:00:00.000Z'}],
    ])('renders %s without leaked placeholders', (templateName, data) => {
        const message = buildEmailMessage({
            from: 'Spotly <spotly@example.test>',
            to: 'nadia@example.test',
            subject: 'Spotly',
            templateName,
            data,
        });

        expect(message.html).toContain('Ressource Test 2');
        expect(message.html).not.toContain('[object Object]');
        expect(message.html).not.toContain('undefined');
    });

    it('renders the updated late pickup warning wording', () => {
        const message = buildEmailMessage({
            from: 'Spotly <spotly@example.test>',
            to: 'nadia@example.test',
            subject: 'Spotly',
            templateName: 'latePickupWarning',
            data: {
                offender: 'Nadia Robert',
                requester: 'Alice Martin',
                resource: 'P-TEST',
                endDate: '2026-04-28T20:00:00.000Z',
            },
        });

        expect(message.text).toContain('Vous vous étiez engagé·e à restituer la ressource P-TEST');
        expect(message.text).toContain('se trouve actuellement en attente');
    });

    it('skips duplicate daily delayed notifications', async () => {
        const db = {
            emailNotificationLog: {
                create: jest.fn()
                    .mockResolvedValueOnce({id: 1})
                    .mockRejectedValueOnce({code: 'P2002'})
            }
        };
        const payload = {
            templateName: 'reservationDelayedAlert',
            to: 'nadia@example.test',
            data: {entryId: 42},
            date: new Date('2026-04-28T10:00:00.000Z')
        };

        await expect(shouldSendDailyNotification(db, payload)).resolves.toMatchObject({allowed: true});
        await expect(shouldSendDailyNotification(db, payload)).resolves.toMatchObject({
            allowed: false,
            contextKey: 'entry:42',
            dateKey: '2026-04-28'
        });
    });
});
