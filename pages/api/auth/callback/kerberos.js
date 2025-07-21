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
                    attributes: ['dc', 'cn', 'givenName', 'sAMAccountName', 'mail', 'sn'],
                });
            } catch (e) {
                console.error('Callback Kerberos: La recherche LDAP a échoué. L\'utilisateur n\'a pas pu être créé avec les détails complets.', e);
                return res.status(500).json({error: "Impossible de récupérer les détails de l'utilisateur depuis l'annuaire. L'utilisateur n'a pas été créé."});
            }


            if (!ldapUser) {
                console.error('Callback Kerberos: Aucun utilisateur trouvé dans l\'annuaire LDAP pour le login:', login);
                return res.status(404).json({error: "Utilisateur non trouvé dans l'annuaire d'entreprise."});
            }

            console.log('[DEBUG] Utilisateur trouvé dans LDAP:', ldapUser);
            user = await prisma.user.create({
                data: {
                    username: login,
                    email: ldapUser.mail ? ldapUser.mail : `${login}@${emailDomain}`,
                    name: ldapUser.givenName,
                    surname: ldapUser.sn,
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