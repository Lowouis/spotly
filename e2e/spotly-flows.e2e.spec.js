import {expect, test} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import {
    getPickupControlMode,
    getReturnControlMode,
    RESERVATION_CONTROL_MODE,
} from '../services/client/reservationModes';

dotenv.config();

const prisma = new PrismaClient();
const passwordHash = bcrypt.hashSync('password', 10);

const state = {};

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

async function ensurePickable(name, distinguishedName) {
    return prisma.pickable.upsert({
        where: {name},
        update: {distinguishedName, description: `${name} e2e`, cgu: `${name} e2e cgu`},
        create: {name, distinguishedName, description: `${name} e2e`, cgu: `${name} e2e cgu`},
    });
}

async function recreateFixtures() {
    await prisma.entry.deleteMany({where: {comment: {startsWith: 'E2E'}}});
    await prisma.resource.deleteMany({where: {name: {startsWith: 'E2E'}}});
    await prisma.category.deleteMany({where: {name: {startsWith: 'E2E'}}});
    await prisma.domain.deleteMany({where: {name: {startsWith: 'E2E'}}});
    await prisma.authorizedLocation.deleteMany({where: {ip: {in: ['10.10.10.10', '10.10.10.11']}}});

    const [fluent, lowTrust, digit, highAuth] = await Promise.all([
        ensurePickable('FLUENT', 'SANS PROTECTION'),
        ensurePickable('LOW_TRUST', 'PAR CLIC'),
        ensurePickable('DIGIT', 'PAR CODE'),
        ensurePickable('HIGH_AUTH', 'RESTRICTION PAR IP'),
    ]);

    const user = await prisma.user.upsert({
        where: {username: 'e2e.user'},
        update: {name: 'E2E', surname: 'User', email: 'e2e.user@spotly.test', role: 'USER', external: false, password: passwordHash},
        create: {username: 'e2e.user', name: 'E2E', surname: 'User', email: 'e2e.user@spotly.test', role: 'USER', external: false, password: passwordHash},
    });

    const admin = await prisma.user.upsert({
        where: {username: 'e2e.flow.admin'},
        update: {name: 'E2E', surname: 'Admin', email: 'e2e.flow.admin@spotly.test', role: 'SUPERADMIN', external: false, password: passwordHash},
        create: {username: 'e2e.flow.admin', name: 'E2E', surname: 'Admin', email: 'e2e.flow.admin@spotly.test', role: 'SUPERADMIN', external: false, password: passwordHash},
    });

    const domain = await prisma.domain.create({
        data: {name: 'E2E Site', pickableId: fluent.id},
    });

    const category = await prisma.category.create({
        data: {name: 'E2E Catégorie', description: 'Catégorie e2e', pickableId: fluent.id},
    });

    const [fluentResource, lowTrustResource, digitResource, highAuthResource, moderatedResource] = await Promise.all([
        prisma.resource.create({
            data: {name: 'E2E Fluent Resource', description: 'Ressource fluide', moderate: false, domainId: domain.id, categoryId: category.id, pickableId: fluent.id, status: 'AVAILABLE'},
        }),
        prisma.resource.create({
            data: {name: 'E2E Low Trust Resource', description: 'Ressource clic', moderate: false, domainId: domain.id, categoryId: category.id, pickableId: lowTrust.id, status: 'AVAILABLE'},
        }),
        prisma.resource.create({
            data: {name: 'E2E Digit Resource', description: 'Ressource code', moderate: false, domainId: domain.id, categoryId: category.id, pickableId: digit.id, status: 'AVAILABLE'},
        }),
        prisma.resource.create({
            data: {name: 'E2E High Auth Resource', description: 'Ressource IP', moderate: false, domainId: domain.id, categoryId: category.id, pickableId: highAuth.id, status: 'AVAILABLE'},
        }),
        prisma.resource.create({
            data: {name: 'E2E Moderated Resource', description: 'Ressource modérée', moderate: true, domainId: domain.id, categoryId: category.id, pickableId: fluent.id, status: 'AVAILABLE'},
        }),
    ]);

    const authorizedLocation = await prisma.authorizedLocation.create({
        data: {libelle: 'E2E Authorized Device', ip: '10.10.10.10'},
    });

    Object.assign(state, {user, admin, domain, category, fluentResource, lowTrustResource, digitResource, highAuthResource, moderatedResource, authorizedLocation});
}

async function authenticateRequest(request) {
    const csrfResponse = await request.get('/api/auth/csrf');
    expect(csrfResponse.status()).toBe(200);
    const {csrfToken} = await csrfResponse.json();

    const loginResponse = await request.post('/api/auth/callback/credentials?json=true', {
        form: {
            csrfToken,
            username: 'e2e.flow.admin',
            password: 'password',
            callbackUrl: '/',
        },
    });
    expect(loginResponse.status()).toBe(200);
}

async function createReservation(request, resource, comment) {
    const start = addMinutes(new Date(), Math.floor(Math.random() * 1000) + 96 * 60);
    const end = addMinutes(start, 60);
    const response = await request.post('/api/entry', {
        data: {
            userId: state.user.id,
            resourceId: resource.id,
            moderate: 'ACCEPTED',
            comment,
            availabilities: [{start: start.toISOString(), end: end.toISOString(), available: true}],
        },
    });

    expect(response.status()).toBe(201);
    return (await response.json())[0];
}

async function getEntryWithRelations(id) {
    return prisma.entry.findUnique({
        where: {id},
        include: {
            resource: {
                include: {
                    pickable: true,
                    category: {include: {pickable: true}},
                    domains: {include: {pickable: true}},
                },
            },
        },
    });
}

test.beforeAll(async () => {
    await recreateFixtures();
});

test.afterAll(async () => {
    await prisma.$disconnect();
});

test.beforeEach(async ({request}) => {
    await authenticateRequest(request);
});

test('services de test LDAP et SSO', async ({request}) => {
    const ldapResponse = await request.post('/api/ldap/test-ldap-connection', {
        data: {
            serverUrl: 'mock://ldap',
            bindDn: 'dc=spotly,dc=test',
            adminCn: 'admin',
            adminDn: 'cn=admin,dc=spotly,dc=test',
            adminPassword: 'admin',
        },
    });
    expect(ldapResponse.status()).toBe(200);

    const kerberosResponse = await request.post('/api/sso/test-kerberos-connection', {
        data: {
            realm: 'SPOTLY.TEST',
            kdc: 'mock-kdc',
            adminServer: 'mock-admin',
            defaultDomain: 'spotly.test',
            serviceHost: 'mock.spotly.test',
            keytabPath: '/tmp/mock.keytab',
        },
    });
    expect(kerberosResponse.status()).toBe(200);

    const ssoResponse = await request.get('/api/public/check-sso?username=admin');
    expect(ssoResponse.status()).toBe(200);
    expect(await ssoResponse.json()).toEqual({ticket: 'test-ticket:admin@SPOTLY.TEST'});

    const callbackResponse = await request.post('/api/auth/callback/kerberos', {
        data: {ticket: 'test-ticket:admin@SPOTLY.TEST'},
    });
    expect(callbackResponse.status()).toBe(200);
    expect((await callbackResponse.json()).username).toBe('admin');
});

test('recherche des ressources disponibles', async ({request}) => {
    const startDate = addMinutes(new Date(), 24 * 60).toISOString();
    const endDate = addMinutes(new Date(), 26 * 60).toISOString();

    const response = await request.get('/api/reservation', {
        params: {
            siteId: String(state.domain.id),
            domainId: String(state.domain.id),
            categoryId: String(state.category.id),
            startDate,
            endDate,
        },
    });

    expect(response.status()).toBe(200);
    const resources = await response.json();
    expect(resources.map((resource) => resource.name)).toEqual(expect.arrayContaining([
        'E2E Fluent Resource',
        'E2E Low Trust Resource',
        'E2E High Auth Resource',
    ]));
});

test('réservation de plusieurs types de ressources', async ({request}) => {
    const acceptedStart = addMinutes(new Date(), 48 * 60);
    const acceptedEnd = addMinutes(acceptedStart, 60);
    const waitingStart = addMinutes(new Date(), 50 * 60);
    const waitingEnd = addMinutes(waitingStart, 60);

    const acceptedResponse = await request.post('/api/entry', {
        data: {
            userId: state.user.id,
            resourceId: state.lowTrustResource.id,
            moderate: 'ACCEPTED',
            comment: 'E2E réservation acceptée',
            availabilities: [{start: acceptedStart.toISOString(), end: acceptedEnd.toISOString(), available: true}],
        },
    });
    expect(acceptedResponse.status()).toBe(201);
    const acceptedEntry = (await acceptedResponse.json())[0];
    expect(acceptedEntry.moderate).toBe('ACCEPTED');
    expect(acceptedEntry.returnedConfirmationCode).toMatch(/^\d{6}$/);

    const waitingResponse = await request.post('/api/entry', {
        data: {
            userId: state.user.id,
            resourceId: state.moderatedResource.id,
            moderate: 'WAITING',
            comment: 'E2E demande modérée',
            availabilities: [{start: waitingStart.toISOString(), end: waitingEnd.toISOString(), available: true}],
        },
    });
    expect(waitingResponse.status()).toBe(201);
    const waitingEntry = (await waitingResponse.json())[0];
    expect(waitingEntry.moderate).toBe('WAITING');

    state.acceptedEntry = acceptedEntry;
});

test('processus de récupération et restitution', async ({request}) => {
    const start = addMinutes(new Date(), 72 * 60);
    const end = addMinutes(start, 60);
    const createdResponse = await request.post('/api/entry', {
        data: {
            userId: state.user.id,
            resourceId: state.fluentResource.id,
            moderate: 'ACCEPTED',
            comment: 'E2E récupération restitution',
            availabilities: [{start: start.toISOString(), end: end.toISOString(), available: true}],
        },
    });
    const entry = (await createdResponse.json())[0];

    const pickupResponse = await request.put(`/api/entry/${entry.id}`, {
        data: {moderate: 'USED'},
    });
    expect(pickupResponse.status()).toBe(200);
    expect((await pickupResponse.json()).moderate).toBe('USED');

    const unavailableResource = await prisma.resource.findUnique({where: {id: state.fluentResource.id}});
    expect(unavailableResource.status).toBe('UNAVAILABLE');

    const returnResponse = await request.put(`/api/entry/${entry.id}`, {
        data: {moderate: 'ENDED', returned: true},
    });
    expect(returnResponse.status()).toBe(200);
    const returnedEntry = await returnResponse.json();
    expect(returnedEntry.moderate).toBe('ENDED');
    expect(returnedEntry.returned).toBe(true);

    const availableResource = await prisma.resource.findUnique({where: {id: state.fluentResource.id}});
    expect(availableResource.status).toBe('AVAILABLE');
});

test('modes de récupération et restitution: automatique, clic, code et IP', async ({request}) => {
    const fluentEntry = await getEntryWithRelations((await createReservation(request, state.fluentResource, 'E2E mode automatique')).id);
    expect(getPickupControlMode(fluentEntry)).toBe(RESERVATION_CONTROL_MODE.AUTOMATIC);
    expect(getReturnControlMode(fluentEntry)).toBe(RESERVATION_CONTROL_MODE.AUTOMATIC);

    const lowTrustEntry = await getEntryWithRelations((await createReservation(request, state.lowTrustResource, 'E2E mode clic')).id);
    expect(getPickupControlMode(lowTrustEntry)).toBe(RESERVATION_CONTROL_MODE.CLICK);
    expect(getReturnControlMode(lowTrustEntry)).toBe(RESERVATION_CONTROL_MODE.CLICK);

    const clickPickup = await request.put(`/api/entry/${lowTrustEntry.id}`, {data: {moderate: 'USED'}});
    expect(clickPickup.status()).toBe(200);
    const clickReturn = await request.put(`/api/entry/${lowTrustEntry.id}`, {data: {moderate: 'ENDED', returned: true}});
    expect(clickReturn.status()).toBe(200);

    const digitEntry = await getEntryWithRelations((await createReservation(request, state.digitResource, 'E2E mode code')).id);
    expect(getPickupControlMode(digitEntry)).toBe(RESERVATION_CONTROL_MODE.CODE);
    expect(getReturnControlMode(digitEntry)).toBe(RESERVATION_CONTROL_MODE.CODE);
    expect(digitEntry.returnedConfirmationCode).toMatch(/^\d{6}$/);

    const digitPickup = await request.put(`/api/entry/${digitEntry.id}`, {data: {moderate: 'USED'}});
    expect(digitPickup.status()).toBe(200);
    const digitReturn = await request.put(`/api/entry/${digitEntry.id}`, {data: {moderate: 'ENDED', returned: true}});
    expect(digitReturn.status()).toBe(200);

    const highAuthEntry = await getEntryWithRelations((await createReservation(request, state.highAuthResource, 'E2E mode code IP')).id);
    expect(getPickupControlMode(highAuthEntry)).toBe(RESERVATION_CONTROL_MODE.CODE);
    expect(getReturnControlMode(highAuthEntry)).toBe(RESERVATION_CONTROL_MODE.CODE);
    expect((await request.get('/api/authorized-location/check/current', {headers: {'x-forwarded-for': '10.10.10.10'}})).status()).toBe(200);
    expect((await request.get('/api/authorized-location/check/current', {headers: {'x-forwarded-for': '10.10.10.11'}})).status()).toBe(401);
});

test('blocage et autorisation par IP', async ({request}) => {
    const authorizedResponse = await request.get('/api/authorized-location/check/current', {headers: {'x-forwarded-for': '10.10.10.10'}});
    expect(authorizedResponse.status()).toBe(200);
    expect((await authorizedResponse.json()).libelle).toBe('E2E Authorized Device');

    const blockedResponse = await request.get('/api/authorized-location/check/current', {headers: {'x-forwarded-for': '10.10.10.11'}});
    expect(blockedResponse.status()).toBe(401);
});
