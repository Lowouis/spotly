import crypto from 'crypto';
import db from '@/server/services/databaseService';
import {encrypt} from '@/services/server/security';
import {validateSmtpConfig} from '@/services/server/smtp-utils';
import {ldapConnectionTest} from '@/services/server/ldap-utils';
import {validateKerberosConfig} from '@/services/server/kerberos-utils';

export async function getSetupSettings() {
    let settings = await db.appSettings.findFirst({orderBy: {id: 'asc'}});

    if (!settings) {
        settings = await db.appSettings.create({data: {}});
    }

    return settings;
}

export async function getSetupStatus() {
    const settings = await getSetupSettings();

    return {
        completed: settings.setupCompleted,
        completedAt: settings.setupCompletedAt,
        mode: settings.setupMode,
        canDevReset: process.env.NODE_ENV !== 'production',
    };
}

export async function assertSetupWritable() {
    const settings = await getSetupSettings();

    if (settings.setupCompleted && process.env.NODE_ENV === 'production') {
        const error = new Error('Le guide de configuration est déjà terminé');
        error.statusCode = 403;
        throw error;
    }

    return settings;
}

export async function checkDatabaseConnection() {
    await db.$queryRaw`SELECT 1`;

    return {
        ok: true,
        provider: 'mysql',
        databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    };
}

export async function saveSmtpSetupConfig(payload) {
    await assertSetupWritable();

    const {host, port, username, password, fromEmail, fromName, secure} = payload;
    if (!host || !port || !username || !fromEmail || !fromName) {
        const error = new Error('Tous les champs SMTP obligatoires sont requis');
        error.statusCode = 400;
        throw error;
    }

    const config = {host, port, username, password, fromEmail, fromName, secure: secure ?? true};
    const validation = await validateSmtpConfig(config);
    if (!validation.success) {
        const error = new Error(validation.error || 'Configuration SMTP invalide');
        error.statusCode = 401;
        throw error;
    }

    await db.smtpConfig.updateMany({where: {isActive: true}, data: {isActive: false}});
    const savedConfig = await db.smtpConfig.create({
        data: {
            host: encrypt(host),
            port: encrypt(String(port)),
            username: encrypt(username),
            password: encrypt(password || ''),
            fromEmail: encrypt(fromEmail),
            fromName: encrypt(fromName),
            secure: secure ?? true,
            updatedBy: 'setup',
        },
    });

    return {id: savedConfig.id};
}

export async function saveLdapSetupConfig(payload) {
    await assertSetupWritable();

    const {serverUrl, bindDn, adminCn, adminDn, adminPassword, emailDomain} = payload;
    if (!serverUrl || !bindDn || !adminCn || !adminDn || !adminPassword) {
        const error = new Error('Tous les champs LDAP obligatoires sont requis');
        error.statusCode = 400;
        throw error;
    }

    const validation = await ldapConnectionTest({
        url: serverUrl,
        bindDN: bindDn,
        bindCredentials: adminPassword,
        adminCn,
        adminDn,
        username: adminCn,
    });
    if (!validation.success) {
        const error = new Error(validation.error || 'Connexion LDAP impossible');
        error.statusCode = 401;
        throw error;
    }

    await db.ldapConfig.updateMany({where: {isActive: true}, data: {isActive: false}});
    const savedConfig = await db.ldapConfig.create({
        data: {
            serverUrl: encrypt(serverUrl),
            bindDn: encrypt(bindDn),
            adminCn: encrypt(adminCn),
            adminDn: encrypt(adminDn),
            adminPassword: encrypt(adminPassword),
            emailDomain: emailDomain ? encrypt(emailDomain) : null,
            updatedBy: 'setup',
            isActive: true,
        },
    });

    return {id: savedConfig.id};
}

export async function saveSsoSetupConfig(payload) {
    await assertSetupWritable();

    const {realm, kdc, adminServer, defaultDomain, serviceHost, keytabPath} = payload;
    if (!realm || !kdc || !adminServer || !defaultDomain || !serviceHost || !keytabPath) {
        const error = new Error('Tous les champs SSO obligatoires sont requis');
        error.statusCode = 400;
        throw error;
    }

    const config = {realm, kdc, adminServer, defaultDomain, serviceHost, keytabPath};
    const validation = await validateKerberosConfig(config);
    if (!validation.success) {
        const error = new Error(validation.error || 'Configuration SSO invalide');
        error.statusCode = 401;
        throw error;
    }

    await db.kerberosConfig.updateMany({where: {isActive: true}, data: {isActive: false}});
    const savedConfig = await db.kerberosConfig.create({
        data: {
            realm: encrypt(realm),
            kdc: encrypt(kdc),
            adminServer: encrypt(adminServer),
            defaultDomain: encrypt(defaultDomain),
            serviceHost: encrypt(serviceHost),
            keytabPath: encrypt(keytabPath),
            updatedBy: 'setup',
            isActive: true,
        },
    });

    return {id: savedConfig.id};
}

export function generateAdminPassword() {
    return crypto.randomBytes(18).toString('base64url');
}

export async function finalizeSetup(mode) {
    await assertSetupWritable();

    if (!['empty', 'demo', 'upgrade'].includes(mode)) {
        const error = new Error('Mode de démarrage invalide');
        error.statusCode = 400;
        throw error;
    }

    if (mode === 'upgrade') {
        const {seedBaseConfiguration} = await import('../../scripts/seed.mjs');
        await seedBaseConfiguration();

        const settings = await getSetupSettings();
        await db.appSettings.update({
            where: {id: settings.id},
            data: {
                setupCompleted: true,
                setupCompletedAt: new Date(),
                setupMode: mode,
                setupAdminUserId: null,
            },
        });

        return {mode, upgraded: true};
    }

    const password = generateAdminPassword();
    const username = 'admin';
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@spotly.local';
    const {seedSpotly} = await import('../../scripts/seed.mjs');
    const {adminUserId} = await seedSpotly({
        withTestData: mode === 'demo',
        forceAdminPassword: true,
        confirmProduction: true,
        adminSeed: {
            name: 'Admin',
            surname: 'Spotly',
            username,
            email,
            password,
        },
    });

    const settings = await getSetupSettings();
    await db.appSettings.update({
        where: {id: settings.id},
        data: {
            setupCompleted: true,
            setupCompletedAt: new Date(),
            setupMode: mode,
            setupAdminUserId: adminUserId,
        },
    });

    return {mode, username, email, password};
}

export async function resetSetupForDevelopment() {
    if (process.env.NODE_ENV === 'production') {
        const error = new Error('Reset du setup interdit en production');
        error.statusCode = 403;
        throw error;
    }

    const settings = await getSetupSettings();
    await db.appSettings.update({
        where: {id: settings.id},
        data: {
            setupCompleted: false,
            setupCompletedAt: null,
            setupMode: null,
            setupAdminUserId: null,
        },
    });
}
