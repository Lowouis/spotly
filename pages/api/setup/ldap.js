import {runMiddleware} from '@/services/server/core';
import {saveLdapSetupConfig} from '@/server/setup/service';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    try {
        if (req.body?.skip) return res.status(200).json({skipped: true});
        const result = await saveLdapSetupConfig(req.body || {});
        return res.status(200).json({message: 'Configuration LDAP enregistrée', ...result});
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || 'Erreur LDAP',
            details: process.env.NODE_ENV === 'development' ? error.stack : null,
        });
    }
}
