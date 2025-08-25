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
                    console.log(`[DEBUG] LDAP SSO bindDn:`, config.bindDn);
                    console.log(`[DEBUG] LDAP SSO filter:`, searchOptions.filter);
                    console.log(`[DEBUG] LDAP SSO scope:`, searchOptions.scope);

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
                            console.log(`[DEBUG] LDAP SSO found user entry:`, entry);
                            console.log(`[DEBUG] LDAP SSO user DN:`, entry.objectName);
                            console.log(`[DEBUG] LDAP SSO user object:`, entry.object);

                            if (entry.object) {
                                console.log(`[DEBUG] LDAP SSO user attributes:`, Object.keys(entry.object));
                                foundUser = entry.object;
                            } else {
                                console.log(`[DEBUG] LDAP SSO entry.object is undefined, trying to access raw attributes`);
                                // Essayer d'accéder aux attributs directement
                                const userData = {};
                                entry.attributes.forEach(attr => {
                                    userData[attr.type] = attr.values[0];
                                });
                                console.log(`[DEBUG] LDAP SSO user data from attributes:`, userData);
                                foundUser = userData;
                            }
                        });

                        res.on('error', (err) => {
                            console.error(`[DEBUG] LDAP SSO search result error:`, err);
                            searchResultError = err;
                        });

                        res.on('end', () => {
                            console.log(`[DEBUG] LDAP SSO search end - foundUser:`, !!foundUser);
                            client.unbind();
                            if (searchResultError) {
                                resolve({success: false, error: searchResultError.message});
                            } else if (foundUser) {
                                resolve({success: true, user: foundUser});
                            } else {
                                // Essayer avec 'cn' si sAMAccountName ne trouve rien
                                console.log(`[DEBUG] LDAP SSO aucun utilisateur trouvé avec sAMAccountName, essai avec cn`);

                                // Test: rechercher tous les utilisateurs pour voir s'il y en a dans cette base
                                console.log(`[DEBUG] LDAP SSO test: recherche de tous les utilisateurs dans la base`);
                                const testClient = ldap.createClient({
                                    url: config.serverUrl,
                                    timeout: 10000,
                                    connectTimeout: 10000,
                                });

                                testClient.bind(config.adminDn, config.adminPassword, (testBindError) => {
                                    if (testBindError) {
                                        console.error(`[DEBUG] LDAP SSO test bind error:`, testBindError);
                                        testClient.unbind();
                                    } else {
                                        const testSearchOptions = {
                                            scope: 'sub',
                                            filter: '(objectClass=user)',
                                            attributes: ['cn', 'sAMAccountName']
                                        };

                                        testClient.search(config.bindDn, testSearchOptions, (testSearchError, testRes) => {
                                            if (testSearchError) {
                                                console.error(`[DEBUG] LDAP SSO test search error:`, testSearchError);
                                            } else {
                                                let userCount = 0;
                                                testRes.on('searchEntry', (entry) => {
                                                    userCount++;
                                                    console.log(`[DEBUG] LDAP SSO test found user ${userCount}:`, entry.object.cn, entry.object.sAMAccountName);
                                                });
                                                testRes.on('end', () => {
                                                    console.log(`[DEBUG] LDAP SSO test: ${userCount} utilisateurs trouvés dans la base`);
                                                    testClient.unbind();
                                                });
                                            }
                                        });
                                    }
                                });

                                // Créer une nouvelle connexion pour la recherche cn
                                const cnClient = ldap.createClient({
                                    url: config.serverUrl,
                                    timeout: 10000,
                                    connectTimeout: 10000,
                                });

                                cnClient.bind(config.adminDn, config.adminPassword, (cnBindError) => {
                                    if (cnBindError) {
                                        console.error(`[DEBUG] LDAP SSO cn bind error:`, cnBindError);
                                        cnClient.unbind();
                                        resolve({success: false, error: cnBindError.message});
                                        return;
                                    }

                                    const cnSearchOptions = {
                                        scope: 'sub',
                                        filter: `(cn=${username})`,
                                        attributes: ['dc', 'cn', 'givenName', 'sAMAccountName', 'mail', 'sn', 'memberOf']
                                    };

                                    console.log(`[DEBUG] LDAP SSO cn search options:`, cnSearchOptions);
                                    console.log(`[DEBUG] LDAP SSO cn filter:`, cnSearchOptions.filter);

                                    cnClient.search(config.bindDn, cnSearchOptions, (cnSearchError, cnRes) => {
                                        if (cnSearchError) {
                                            console.error(`[DEBUG] LDAP SSO cn search error:`, cnSearchError);
                                            cnClient.unbind();
                                            resolve({success: false, error: cnSearchError.message});
                                            return;
                                        }

                                        let cnFoundUser = null;
                                        let cnSearchResultError = null;

                                        cnRes.on('searchEntry', (entry) => {
                                            console.log(`[DEBUG] LDAP SSO found user with cn entry:`, entry);
                                            console.log(`[DEBUG] LDAP SSO cn user DN:`, entry.objectName);
                                            console.log(`[DEBUG] LDAP SSO cn user object:`, entry.object);

                                            if (entry.object) {
                                                console.log(`[DEBUG] LDAP SSO cn user attributes:`, Object.keys(entry.object));
                                                cnFoundUser = entry.object;
                                            } else {
                                                console.log(`[DEBUG] LDAP SSO cn entry.object is undefined, trying to access raw attributes`);
                                                // Essayer d'accéder aux attributs directement
                                                const userData = {};
                                                entry.attributes.forEach(attr => {
                                                    userData[attr.type] = attr.values[0];
                                                });
                                                console.log(`[DEBUG] LDAP SSO cn user data from attributes:`, userData);
                                                cnFoundUser = userData;
                                            }
                                        });

                                        cnRes.on('error', (err) => {
                                            console.error(`[DEBUG] LDAP SSO cn search result error:`, err);
                                            cnSearchResultError = err;
                                        });

                                        cnRes.on('end', () => {
                                            console.log(`[DEBUG] LDAP SSO cn search end - cnFoundUser:`, !!cnFoundUser);
                                            cnClient.unbind();
                                            if (cnSearchResultError) {
                                                resolve({success: false, error: cnSearchResultError.message});
                                            } else if (cnFoundUser) {
                                                resolve({success: true, user: cnFoundUser});
                                            } else {
                                                resolve({success: false, error: 'Utilisateur non trouvé'});
                                            }
                                        });
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