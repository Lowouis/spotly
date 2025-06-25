import {encrypt} from '@/lib/security';
import {ldapConnectionTest} from '@/lib/ldap-utils';
import {runMiddleware} from "@/lib/core";
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    // Validation des données
    const {serverUrl, bindDn, adminCn, adminDn, adminPassword, emailDomain} = req.body;
    if (!serverUrl || !bindDn || !adminCn || !adminDn || !adminPassword) {
        return res.status(400).json({message: 'Tous les champs sont requis'});
    }

    try {
        // 1. Validation des credentials LDAP
        const ldapConfig = {
            url: serverUrl,
            bindDN: bindDn,
            bindCredentials: adminPassword,
            adminCn: adminCn,
            adminDn: adminDn,
            username: adminCn
        };
        console.log(ldapConfig);

        const connectionResult = await ldapConnectionTest(ldapConfig);
        console.log("TEST EN COURS")
        if (!connectionResult.success) {
            return res.status(401).json({
                message: 'Échec de la connexion LDAP',
                details: connectionResult.error
            });
        }

        // 2. Chiffrement des données sensibles
        const encryptedData = {
            serverUrl: encrypt(serverUrl),
            bindDn: encrypt(bindDn),
            adminCn: encrypt(adminCn),
            adminDn: encrypt(adminDn),
            adminPassword: encrypt(adminPassword),
            emailDomain: emailDomain ? encrypt(emailDomain) : null,
        };

        // 3. Sauvegarde sécurisée
        const savedConfig = await prisma.ldapConfig.create({
            data: {
                ...encryptedData,
                lastUpdated: new Date(),
                updatedBy: req.session?.user ? `${req.session.user.name} ${req.session.user.surname}` : 'System'
            }
        });

        return res.status(200).json({
            message: 'Configuration sauvegardée avec succès',
            id: savedConfig.id
        });

    } catch (error) {
        console.error('LDAP config save error:', error);
        return res.status(500).json({
            message: 'Erreur interne du serveur',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
}