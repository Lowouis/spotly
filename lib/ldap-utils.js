import {authenticate} from 'ldap-authentication';

export async function ldapConnectionTest(config) {
    try {
        // Tenter une authentification simple pour vérifier la connexion
        await authenticate({
            ldapOpts: {
                url: config.url,
                timeout: 5000,
                connectTimeout: 5000,
                tlsOptions: {rejectUnauthorized: false}
            },
            adminDn: config.bindDN,
            adminPassword: config.bindCredentials,
            // Ces valeurs sont ignorées car nous faisons juste un test de connexion admin
            userSearchBase: "dc=example,dc=com",
            usernameAttribute: 'cn',
            username: 'test',
            // Ne pas inclure userPassword pour éviter une tentative d'authentification utilisateur
        });

        // Si nous arrivons ici, la connexion a réussi
        return {success: true};
    } catch (error) {
        return {
            success: false,
            error: `Échec de connexion LDAP: ${error.message}`
        };
    }
}