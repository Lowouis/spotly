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

            // Rechercher l'utilisateur dans LDAP
            const ldapResult = await findLdapUser(decryptedConfig, login);

            if (!ldapResult.success || !ldapResult.user) {
                console.error('Callback Kerberos: Aucun utilisateur trouvé dans l\'annuaire LDAP pour le login:', login);
                return res.status(404).json({error: "Utilisateur non trouvé dans l'annuaire d'entreprise."});
            }

            const ldapUser = ldapResult.user;
            console.log('[DEBUG] Utilisateur trouvé dans LDAP:', ldapUser);

            // Créer l'utilisateur dans la base de données
            user = await prisma.user.create({
                data: {
                    username: login,
                    email: ldapUser.mail || (decryptedConfig.emailDomain ? `${login}@${decryptedConfig.emailDomain}` : null),
                    name: ldapUser.givenName || '',
                    surname: ldapUser.sn || '',
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