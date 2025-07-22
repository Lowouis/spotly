import {authenticate} from 'ldap-authentication';

export async function ldapConnectionTest(config) {
    try {
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
        const authOptions = {
            ldapOpts: {
                url: config.serverUrl,
                timeout: 10000,
                connectTimeout: 10000,
            },
            adminDn: config.adminDn,
            adminPassword: config.adminPassword,
            userSearchBase: config.bindDn,
            usernameAttribute: 'sAMAccountName', // Utiliser sAMAccountName pour Active Directory
            username: username,
            attributes: ['dc', 'cn', 'givenName', 'sAMAccountName', 'mail', 'sn', 'memberOf'],
        };

        // Ajouter le mot de passe selon le contexte
        if (withPassword && password) {
            // Authentification standard avec mot de passe utilisateur
            authOptions.userPassword = password;
        } else if (isSSOMode) {
            // Mode SSO: utiliser le mot de passe admin car l'authentification
            // a déjà été validée par le ticket Kerberos
            console.log(`[DEBUG] LDAP: Mode SSO activé pour ${username}, utilisation du mot de passe admin pour la recherche`);
            authOptions.userPassword = config.adminPassword;
        }

        const user = await authenticate(authOptions);
        return {success: true, user};
    } catch (error) {
        console.error(`Erreur lors de la recherche LDAP pour ${username}:`, error);
        return {
            success: false,
            error: error.message || 'Erreur lors de la recherche LDAP'
        };
    }
}