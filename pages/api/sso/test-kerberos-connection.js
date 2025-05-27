import {validateKerberosConfig} from '@/lib/kerberos-utils';
import {runMiddleware} from "@/lib/core";

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
        const config = {
            realm,
            kdc,
            adminServer,
            defaultDomain
        };

        const validationResult = await validateKerberosConfig(config);

        if (!validationResult.success) {
            return res.status(401).json({
                message: 'Échec de la connexion Kerberos',
                details: validationResult.error
            });
        }

        return res.status(200).json({
            message: 'Connexion Kerberos réussie'
        });

    } catch (error) {
        console.error('Kerberos connection test error:', error);
        return res.status(500).json({
            message: 'Erreur lors du test de connexion',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
} 