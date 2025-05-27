import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";
import {encrypt} from '@/lib/security';
import {validateKerberosConfig} from '@/lib/kerberos-utils';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const {realm, kdc, adminServer, defaultDomain} = req.body;
    if (!realm || !kdc || !adminServer || !defaultDomain) {
        return res.status(400).json({message: 'Tous les champs sont requis'});
    }

    try {
        // 1. Validation de la configuration Kerberos
        const config = {
            realm,
            kdc,
            adminServer,
            defaultDomain
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
            defaultDomain: encrypt(defaultDomain)
        };

        // 3. Désactiver toutes les configurations existantes
        await prisma.kerberosConfig.updateMany({
            where: {isActive: true},
            data: {isActive: false}
        });

        // 4. Sauvegarder la nouvelle configuration
        const savedConfig = await prisma.kerberosConfig.create({
            data: {
                ...encryptedData,
                lastUpdated: new Date(),
                updatedBy: req.session?.user?.name || 'system'
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