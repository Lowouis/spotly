import {validateKerberosTicket} from "@/lib/kerberos-auth";
import prisma from "@/prismaconf/init";
import {decrypt} from "@/lib/security";
import {findLdapUser} from '@/lib/ldap-utils';

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        return res.status(405).end();
    }

    const {ticket} = req.body;
    if (!ticket) {
        return res.status(400).json({error: "Ticket manquant"});
    }

    try {
        const validationResult = await validateKerberosTicket(ticket);

        if (!validationResult || !validationResult.username || !validationResult.success) {
            console.error("Callback Kerberos: Échec de la validation du ticket.");
            return res.status(401).json({error: "Ticket Kerberos invalide"});
        }

        // Extraire le login avant le @
        const login = validationResult.username.split('@')[0];

        // Rechercher l'utilisateur dans la base de données
        let user = await prisma.user.findUnique({
            where: {username: login},
        });

        if (!user) {
            // Charger la config LDAP
            const ldapConfig = await prisma.ldapConfig.findFirst({
                where: {isActive: true},
                orderBy: {lastUpdated: 'desc'}
            });

            if (!ldapConfig) {
                console.error("Callback Kerberos: Configuration LDAP manquante.");
                return res.status(500).json({error: "La configuration LDAP est manquante."});
            }

            // Préparer la configuration LDAP déchiffrée
            const decryptedConfig = {
                serverUrl: decrypt(ldapConfig.serverUrl),
                bindDn: decrypt(ldapConfig.bindDn),
                adminDn: decrypt(ldapConfig.adminDn),
                adminPassword: decrypt(ldapConfig.adminPassword),
                emailDomain: ldapConfig.emailDomain ? decrypt(ldapConfig.emailDomain) : null
            };

            console.log(`[DEBUG] Callback Kerberos: Recherche LDAP pour ${login} avec config:`, {
                serverUrl: decryptedConfig.serverUrl,
                bindDn: decryptedConfig.bindDn,
                adminDn: decryptedConfig.adminDn,
                emailDomain: decryptedConfig.emailDomain
            });

            // Rechercher l'utilisateur dans LDAP avec le mode SSO activé
            try {
                const ldapResult = await findLdapUser(decryptedConfig, login, false, null, true);

                if (!ldapResult.success || !ldapResult.user) {
                    console.error('Callback Kerberos: Aucun utilisateur trouvé dans l\'annuaire LDAP pour le login:', login);
                    console.error('Callback Kerberos: Résultat LDAP:', ldapResult);
                    return res.status(404).json({error: `Utilisateur non trouvé dans l'annuaire d'entreprise : ${login}`});
                }

                const ldapUser = ldapResult.user;
                console.log('[DEBUG] Utilisateur trouvé dans LDAP:', JSON.stringify(ldapUser, null, 2));

                // Créer l'utilisateur dans la base de données
                user = await prisma.user.create({
                    data: {
                        username: login,
                        email: ldapUser.mail || (decryptedConfig.emailDomain ? `${login}@${decryptedConfig.emailDomain}` : null),
                        name: ldapUser.givenName || login,
                        surname: ldapUser.sn || '',
                        external: true,
                        password: null,
                    },
                });

                console.log(`[DEBUG] Utilisateur SSO créé avec données LDAP:`, user);
            } catch (ldapError) {
                console.error('Callback Kerberos: Erreur lors de la recherche LDAP:', ldapError);

                // Fallback: créer l'utilisateur avec les informations de base
                console.log(`[DEBUG] Fallback: Création d'utilisateur SSO basique pour: ${login}`);

                user = await prisma.user.create({
                    data: {
                        username: login,
                        email: decryptedConfig.emailDomain ? `${login}@${decryptedConfig.emailDomain}` : null,
                        name: login,
                        surname: '',
                        external: true,
                        password: null,
                    },
                });

                console.log(`[DEBUG] Utilisateur SSO créé en fallback:`, user);
            }
        }

        return res.status(200).json(user);

    } catch (error) {
        console.error("Erreur majeure dans le callback Kerberos:", error);
        return res.status(500).json({error: "Erreur interne du serveur"});
    }
}