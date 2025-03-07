import { authenticate } from 'ldap-authentication';

export async function ldapConnectionTest(config) {
    try {
        // Tenter une authentification simple pour vérifier la connexion
        await authenticate({
            ldapOpts: {
                url: config.url,
                timeout: 5000,
                connectTimeout: 5000,
                tlsOptions: { rejectUnauthorized: false }
            },
            adminDn: config.adminCn,
            adminPassword: config.bindCredentials,
            userPassword: config.bindCredentials,
            userSearchBase: config.bindDN,
            usernameAttribute: 'cn',
            username: config.username,
            attributes: ['dc', 'cn', 'givenName', 'sAMAccountName', 'mail', 'sn'],
        });
        // Si nous arrivons ici, la connexion a réussi
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: `Échec de connexion LDAP: ${error.message}`
        };
    }
}