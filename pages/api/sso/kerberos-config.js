import db from "@/server/services/databaseService";
import {runMiddleware} from "@/services/server/core";
import {decrypt} from '@/services/server/security';
import {requireAdmin} from '@/services/server/api-auth';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed'});
    }
    if (!await requireAdmin(req, res)) return;

    try {
        const config = await db.kerberosConfig.findFirst({
            orderBy: {lastUpdated: 'desc'},
        });

        if (!config) {
            return res.status(404).json({message: 'Aucune configuration Kerberos trouvée'});
        }

        return res.status(200).json({
            realm: decrypt(config.realm),
            kdc: decrypt(config.kdc),
            adminServer: decrypt(config.adminServer),
            defaultDomain: decrypt(config.defaultDomain),
            serviceHost: decrypt(config.serviceHost),
            keytabPath: decrypt(config.keytabPath),
            isActive: config.isActive,
        });
    } catch (error) {
        console.error('Kerberos config fetch error:', error);
        return res.status(500).json({
            message: 'Erreur lors de la récupération de la configuration',
            details: process.env.NODE_ENV === 'development' ? error.message : null,
        });
    }
}
