import {exec} from 'child_process';
import {promisify} from 'util';
import {decrypt} from '@/services/server/security';
import {ldapConnectionTest} from '@/services/server/ldap-utils';
import {validateSmtpConfig} from '@/services/server/smtp-utils';
import {isMockKerberosConfig} from '@/services/server/test-auth-service';

const execPromise = promisify(exec);

export async function getLdapConfigStatus(dbClient) {
    const config = await dbClient.ldapConfig.findFirst({
        where: {isActive: true},
        orderBy: {lastUpdated: 'desc'},
    });
    if (!config) return 'none';

    const serverUrl = decrypt(config.serverUrl);
    const bindDn = decrypt(config.bindDn);
    const adminCn = decrypt(config.adminCn);
    const adminDn = decrypt(config.adminDn);
    const adminPassword = decrypt(config.adminPassword);

    if (!serverUrl || !bindDn || !adminCn || !adminDn || !adminPassword) return 'none';

    const result = await ldapConnectionTest({
        url: serverUrl,
        bindDN: bindDn,
        bindCredentials: adminPassword,
        adminCn,
        adminDn,
        username: adminCn,
    });

    return result.success ? 'success' : 'error';
}

export async function getSsoConfigStatus(dbClient) {
    const config = await dbClient.kerberosConfig.findFirst({
        orderBy: {lastUpdated: 'desc'},
    });
    if (!config || !config.isActive) return 'none';

    const realm = decrypt(config.realm);
    const kdc = decrypt(config.kdc);
    const adminServer = decrypt(config.adminServer);
    const defaultDomain = decrypt(config.defaultDomain);
    const serviceHost = decrypt(config.serviceHost);
    const keytabPath = decrypt(config.keytabPath);

    if (!realm || !kdc || !adminServer || !defaultDomain || !serviceHost || !keytabPath) return 'none';

    try {
        if (isMockKerberosConfig({realm, serviceHost})) {
            return 'success';
        }

        const principal = `HTTP/${serviceHost}@${realm}`;
        await execPromise(`kinit -k -t ${keytabPath} ${principal}`);
        await execPromise('kdestroy');
        return 'success';
    } catch {
        return 'error';
    }
}

export async function getSmtpConfigStatus(dbClient) {
    const config = await dbClient.smtpConfig.findFirst({
        where: {isActive: true},
        orderBy: {lastUpdated: 'desc'},
    });
    if (!config) return 'none';

    const host = decrypt(config.host);
    const port = decrypt(config.port);
    const username = decrypt(config.username);
    const password = decrypt(config.password);
    const fromEmail = decrypt(config.fromEmail);
    const fromName = decrypt(config.fromName);

    if (!host || !port || !username || !password || !fromEmail || !fromName) return 'none';

    const result = await validateSmtpConfig({
        host,
        port,
        username,
        password,
        secure: config.secure,
    });

    return result.success ? 'success' : 'error';
}

export async function getAllConfigStatuses(dbClient) {
    const [ldap, sso, smtp] = await Promise.all([
        getLdapConfigStatus(dbClient),
        getSsoConfigStatus(dbClient),
        getSmtpConfigStatus(dbClient),
    ]);

    return {ldap, sso, smtp};
}
