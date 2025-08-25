import {authenticate} from 'ldap-authentication';
import ldap from 'ldapjs';

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

        if (isSSOMode) {
            // Mode SSO: recherche simple sans authentification utilisateur
            // car l'authentification a déjà été validée par le ticket Kerberos
            console.log(`[DEBUG] LDAP: Mode SSO activé pour ${username}, recherche simple avec credentials admin`);

            // Utiliser ldapjs pour une recherche directe sans authentification utilisateur
            return new Promise((resolve, reject) => {
                const client = ldap.createClient({
                    url: config.serverUrl,
                    timeout: 10000,
                    connectTimeout: 10000,
                });

                client.bind(config.adminDn, config.adminPassword, (bindError) => {
                    if (bindError) {
                        console.error(`[DEBUG] LDAP SSO bind error:`, bindError);
                        client.unbind();
                        resolve({success: false, error: bindError.message});
                        return;
                    }

                    // Rechercher l'utilisateur
                    const searchOptions = {
                        scope: 'sub',
                        filter: `(sAMAccountName=${username})`,
                        attributes: ['dc', 'cn', 'givenName', 'sAMAccountName', 'mail', 'sn', 'memberOf']
                    };

                    console.log(`[DEBUG] LDAP SSO search options:`, searchOptions);

                    client.search(config.bindDn, searchOptions, (searchError, res) => {
                        if (searchError) {
                            console.error(`[DEBUG] LDAP SSO search error:`, searchError);
                            client.unbind();
                            resolve({success: false, error: searchError.message});
                            return;
                        }

                        let foundUser = null;
                        let searchResultError = null;

                        res.on('searchEntry', (entry) => {
                            console.log(`[DEBUG] LDAP SSO found user:`, entry.object);
                            foundUser = entry.object;
                        });

                        res.on('error', (err) => {
                            console.error(`[DEBUG] LDAP SSO search result error:`, err);
                            searchResultError = err;
                        });

                        res.on('end', () => {
                            client.unbind();
                            if (searchResultError) {
                                resolve({success: false, error: searchResultError.message});
                            } else if (foundUser) {
                                resolve({success: true, user: foundUser});
                            } else {
                                // Essayer avec 'cn' si sAMAccountName ne trouve rien
                                console.log(`[DEBUG] LDAP SSO aucun utilisateur trouvé avec sAMAccountName, essai avec cn`);
                                const cnSearchOptions = {
                                    scope: 'sub',
                                    filter: `(cn=${username})`,
                                    attributes: ['dc', 'cn', 'givenName', 'sAMAccountName', 'mail', 'sn', 'memberOf']
                                };

                                client.search(config.bindDn, cnSearchOptions, (cnSearchError, cnRes) => {
                                    if (cnSearchError) {
                                        console.error(`[DEBUG] LDAP SSO cn search error:`, cnSearchError);
                                        client.unbind();
                                        resolve({success: false, error: cnSearchError.message});
                                        return;
                                    }

                                    let cnFoundUser = null;
                                    let cnSearchResultError = null;

                                    cnRes.on('searchEntry', (entry) => {
                                        console.log(`[DEBUG] LDAP SSO found user with cn:`, entry.object);
                                        cnFoundUser = entry.object;
                                    });

                                    cnRes.on('error', (err) => {
                                        console.error(`[DEBUG] LDAP SSO cn search result error:`, err);
                                        cnSearchResultError = err;
                                    });

                                    cnRes.on('end', () => {
                                        client.unbind();
                                        if (cnSearchResultError) {
                                            resolve({success: false, error: cnSearchResultError.message});
                                        } else if (cnFoundUser) {
                                            resolve({success: true, user: cnFoundUser});
                                        } else {
                                            resolve({success: false, error: 'Utilisateur non trouvé'});
                                        }
                                    });
                                });
                            }
                        });
                    });
                });
            });
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