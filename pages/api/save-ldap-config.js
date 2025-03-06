import {encrypt} from '@/lib/security';
import {ldapConnectionTest} from '@/lib/ldap-utils';

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Validation des données
    const { serverUrl, bindDn, adminCn, adminPassword } = req.body;

    if (!serverUrl || !bindDn || !adminCn || !adminPassword) {
        return res.status(400).json({message: 'Tous les champs sont requis'});
    }

    try {
        // 1. Validation des credentials LDAP
        const ldapConfig = {
            url: serverUrl,
            bindDN: bindDn,
            bindCredentials: adminPassword
        };

        const connectionResult = await ldapConnectionTest(ldapConfig);

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
            adminPassword: encrypt(adminPassword)
        };

        // 3. Sauvegarde sécurisée (exemple avec Prisma)
        const savedConfig = await prisma.ldapConfig.create({
            data: {
                ...encryptedData,
                lastUpdated: new Date(),
                updatedBy: req.session.userId // À adapter selon votre système d'authentification
            }
        });

        // 4. Rotation des clés (logique à implémenter séparément)
        rotateEncryptionKeysIfNeeded();

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