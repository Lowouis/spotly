import {runMiddleware} from '@/services/server/core';
import {getSetupStatus} from '@/server/setup/service';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    try {
        return res.status(200).json(await getSetupStatus());
    } catch (error) {
        return res.status(500).json({
            message: 'Impossible de lire le statut de configuration',
            details: process.env.NODE_ENV === 'development' ? error.message : null,
        });
    }
}
