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
 * @returns {Promise<Object>} - Informations de l'utilisateur
 */
export async function findLdapUser(config, username, withPassword = false, password = null) {
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

        // Ajouter le mot de passe si l'authentification est requise
        if (withPassword && password) {
            authOptions.userPassword = password;
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