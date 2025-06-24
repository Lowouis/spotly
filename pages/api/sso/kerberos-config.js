import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";
import {decrypt} from '@/lib/security';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    try {
        // Récupérer la dernière configuration active
        const config = await prisma.kerberosConfig.findFirst({
            where: {
                isActive: true
            },
            orderBy: {
                lastUpdated: 'desc'
            }
        });

        if (!config) {
            return res.status(404).json({
                message: 'Aucune configuration Kerberos trouvée'
            });
        }

        // Décrypter les données sensibles
        const decryptedConfig = {
            realm: decrypt(config.realm),
            kdc: decrypt(config.kdc),
            adminServer: decrypt(config.adminServer),
            defaultDomain: decrypt(config.defaultDomain),
            serviceHost: decrypt(config.serviceHost),
            keytabPath: decrypt(config.keytabPath)
        };

        return res.status(200).json(decryptedConfig);

    } catch (error) {
        console.error('Kerberos config fetch error:', error);
        return res.status(500).json({
            message: 'Erreur lors de la récupération de la configuration',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
} 