import {authenticate} from 'ldap-authentication';
import ldap from 'ldapjs';
import {findTestLdapUser, isMockLdapConfig, testLdapConnection} from '@/services/server/test-auth-service';

export async function ldapConnectionTest(config) {
    try {
        if (isMockLdapConfig(config)) {
            return testLdapConnection(config);
        }

        // Tenter une authentification simple pour vérifier la connexion
        await authenticate({
            ldapOpts: {
                url: config.url,
                //timeout: 5000,
                //connectTimeout: 5000,
                //tlsOptions: { rejectUnauthorized: false }
            },
            adminDn: config.adminDn,
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

/**
 * Recherche un utilisateur dans l'annuaire LDAP
 * @param {Object} config - Configuration LDAP
 * @param {string} username - Nom d'utilisateur à rechercher
 * @param {boolean} withPassword - Indique si l'authentification avec mot de passe est requise
 * @param {string} password - Mot de passe de l'utilisateur (optionnel)
 * @param {boolean} isSSOMode - Indique si l'appel est fait dans le contexte SSO (ticket Kerberos déjà validé)
 * @returns {Promise<Object>} - Informations de l'utilisateur
 */
export async function findLdapUser(config, username, withPassword = false, password = null, isSSOMode = false) {
    try {
        if (isMockLdapConfig(config)) {
            return findTestLdapUser(username);
        }

        const usernameAttributes = [config.usernameAttribute, 'sAMAccountName', 'uid'].filter(Boolean);

        for (const usernameAttribute of [...new Set(usernameAttributes)]) {
            const result = await findLdapUserByAttribute(config, username, usernameAttribute, withPassword, password, isSSOMode);
            if (result.success) return result;
        }

        return {
            success: false,
            error: 'Utilisateur introuvable dans LDAP'
        };
    } catch (error) {
        console.error(`Erreur lors de la recherche LDAP pour ${username}:`, error);
        return {
            success: false,
            error: error.message || 'Erreur lors de la recherche LDAP'
        };
    }
}

export function normalizeLdapUser(user) {
    const username = user.uid || user.sAMAccountName || user.cn;
    const fullNameParts = String(user.cn || '').split(' ').filter(Boolean);

    return {
        username: username ? String(username) : null,
        email: user.mail ? String(user.mail) : null,
        name: user.givenName ? String(user.givenName) : (fullNameParts[0] || ''),
        surname: user.sn ? String(user.sn) : (fullNameParts.slice(1).join(' ') || ''),
        external: true,
        password: null,
        role: 'USER',
    };
}

export async function listLdapUsers(config) {
    if (isMockLdapConfig(config)) {
        return [
            normalizeLdapUser({uid: 'alice', givenName: 'Alice', sn: 'Martin', mail: 'alice@spotly.test'}),
            normalizeLdapUser({uid: 'karim', givenName: 'Karim', sn: 'Benali', mail: 'karim@spotly.test'}),
            normalizeLdapUser({uid: 'sophie', givenName: 'Sophie', sn: 'Durand', mail: 'sophie@spotly.test'}),
            normalizeLdapUser({uid: 'thomas', givenName: 'Thomas', sn: 'Petit', mail: 'thomas@spotly.test'}),
            normalizeLdapUser({uid: 'nadia', givenName: 'Nadia', sn: 'Robert', mail: 'nadia@spotly.test'}),
        ];
    }

    const client = ldap.createClient({
        url: config.serverUrl,
        timeout: 10000,
        connectTimeout: 10000,
    });

    const bind = () => new Promise((resolve, reject) => {
        client.bind(config.adminDn, config.adminPassword, (error) => error ? reject(error) : resolve());
    });

    const search = () => new Promise((resolve, reject) => {
        const users = [];
        client.search(config.bindDn, {
            scope: 'sub',
            filter: '(|(objectClass=inetOrgPerson)(objectClass=organizationalPerson))',
            attributes: ['uid', 'sAMAccountName', 'cn', 'givenName', 'sn', 'mail', 'entryUUID'],
        }, (error, res) => {
            if (error) {
                reject(error);
                return;
            }

            res.on('searchEntry', (entry) => {
                const raw = entry.pojo?.attributes?.reduce((acc, attribute) => {
                    acc[attribute.type] = attribute.values?.[0];
                    return acc;
                }, {}) || entry.object || {};
                const normalized = normalizeLdapUser(raw);
                if (normalized.username) users.push(normalized);
            });
            res.on('error', reject);
            res.on('end', () => resolve(users));
        });
    });

    try {
        await bind();
        return await search();
    } finally {
        client.unbind();
    }
}

async function findLdapUserByAttribute(config, username, usernameAttribute, withPassword = false, password = null, isSSOMode = false) {
    try {
        const authOptions = {
            ldapOpts: {
                url: config.serverUrl,
                timeout: 10000,
                connectTimeout: 10000,
            },
            adminDn: config.adminDn,
            adminPassword: config.adminPassword,
            userSearchBase: config.bindDn,
            usernameAttribute,
            username: username,
            attributes: ['dc', 'cn', 'givenName', 'uid', 'sAMAccountName', 'mail', 'sn', 'memberOf', 'entryUUID'],
        };

        if (isSSOMode) {
            // Mode SSO: recherche simple sans authentification utilisateur
            // car l'authentification a déjà été validée par le ticket Kerberos
            console.log(`[DEBUG] LDAP: Mode SSO activé pour ${username}, recherche simple avec credentials admin`);

            // Utiliser une recherche LDAP directe sans authentification utilisateur
            const searchOptions = {
                ldapOpts: {
                    url: config.serverUrl,
                    timeout: 10000,
                    connectTimeout: 10000,
                },
                adminDn: config.adminDn,
                adminPassword: config.adminPassword,
                userSearchBase: config.bindDn,
                usernameAttribute,
                username: username,
                attributes: ['dc', 'cn', 'givenName', 'uid', 'sAMAccountName', 'mail', 'sn', 'memberOf', 'entryUUID'],
                // Pas de userPassword = recherche simple
            };

            const user = await authenticate(searchOptions);
            return {success: true, user};
        } else {
            // Mode normal: authentification avec mot de passe utilisateur
            if (withPassword && password) {
                authOptions.userPassword = password;
            }

            const user = await authenticate(authOptions);
            return {success: true, user};
        }
    } catch (error) {
        console.error(`Erreur lors de la recherche LDAP pour ${username}:`, error);
        return {
            success: false,
            error: error.message || 'Erreur lors de la recherche LDAP'
        };
    }
}
