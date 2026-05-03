import {runMiddleware} from '@/services/server/core';
import {finalizeSetup} from '@/server/setup/service';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    try {
        const result = await finalizeSetup(req.body?.mode);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || 'Erreur lors de la finalisation',
            details: process.env.NODE_ENV === 'development' ? error.stack : null,
        });
    }
}
