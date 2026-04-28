import db from "@/server/services/databaseService";
import {runMiddleware} from "@/services/server/core";
import {encrypt} from '@/services/server/security';
import {validateKerberosConfig} from '@/services/server/kerberos-utils';
import {requireAdmin} from '@/services/server/api-auth';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        return res.status(405).json({message: 'Method not allowed'});
    }
    if (req.method === 'OPTIONS') return res.status(200).json({message: 'OK'});
    const session = await requireAdmin(req, res);
    if (!session) return;

    const {realm, kdc, adminServer, defaultDomain, serviceHost, keytabPath} = req.body;
    if (!realm || !kdc || !adminServer || !defaultDomain || !serviceHost || !keytabPath) {
        return res.status(400).json({message: 'Tous les champs sont requis'});
    }

    try {
        // 1. Validation de la configuration Kerberos
        const config = {
            realm,
            kdc,
            adminServer,
            defaultDomain,
            serviceHost,
            keytabPath
        };

        const validationResult = await validateKerberosConfig(config);
        if (!validationResult.success) {
            return res.status(401).json({
                message: 'Configuration Kerberos invalide',
                details: validationResult.error
            });
        }

        // 2. Chiffrement des données sensibles
        const encryptedData = {
            realm: encrypt(realm),
            kdc: encrypt(kdc),
            adminServer: encrypt(adminServer),
            defaultDomain: encrypt(defaultDomain),
            serviceHost: encrypt(serviceHost),
            keytabPath: encrypt(keytabPath)
        };

        // 3. Désactiver toutes les configurations existantes
        await db.kerberosConfig.updateMany({
            where: {isActive: true},
            data: {isActive: false}
        });

        // 4. Sauvegarder la nouvelle configuration
        const savedConfig = await db.kerberosConfig.create({
            data: {
                ...encryptedData,
                lastUpdated: new Date(),
                updatedBy: session.user.name || session.user.username || 'system'
            }
        });

        return res.status(200).json({
            message: 'Configuration sauvegardée avec succès',
            id: savedConfig.id
        });

    } catch (error) {
        console.error('Kerberos config save error:', error);
        return res.status(500).json({
            message: 'Erreur lors de la sauvegarde de la configuration',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
} 
