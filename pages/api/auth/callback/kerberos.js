import {validateKerberosTicket} from "@/lib/kerberos-auth";
import prisma from "@/prismaconf/init";
import {decrypt} from "@/lib/security";
import {authenticate} from 'ldap-authentication';

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
        let user = await prisma.user.findUnique({
            where: {username: login},
        });

        if (!user) {
            // Charger la config LDAP
            const ldapConfig = await prisma.ldapConfig.findFirst({
                where: {isActive: true},
                orderBy: {lastUpdated: 'desc'}
            });

            if (!ldapConfig || !ldapConfig.emailDomain) {
                console.error("Callback Kerberos: Configuration du domaine de messagerie manquante.");
                return res.status(500).json({error: "La configuration du domaine de messagerie est manquante."});
            }
            const emailDomain = decrypt(ldapConfig.emailDomain);
            let ldapUser = null;
            try {
                ldapUser = await authenticate({
                    ldapOpts: {
                        url: decrypt(ldapConfig.serverUrl),
                    },
                    adminDn: decrypt(ldapConfig.adminDn),
                    adminPassword: decrypt(ldapConfig.adminPassword),
                    userSearchBase: decrypt(ldapConfig.bindDn),
                    usernameAttribute: 'sAMAccountName',
                    username: login,
                    attributes: ['mail', 'givenName', 'sn', 'sAMAccountName'],
                });
            } catch (e) {
                console.error('Callback Kerberos: LDAP user search failed:', e);
            }
            user = await prisma.user.create({
                data: {
                    username: login,
                    email: ldapUser && ldapUser.mail ? ldapUser.mail : `${login}@${emailDomain}`,
                    name: ldapUser && ldapUser.givenName ? ldapUser.givenName : null,
                    surname: ldapUser && ldapUser.sn ? ldapUser.sn : null,
                    external: true,
                    password: null,
                },
            });
        }

        return res.status(200).json(user);

    } catch (error) {
        console.error("Erreur majeure dans le callback Kerberos:", error);
        return res.status(500).json({error: "Erreur interne du serveur"});
    }
} 