import {runMiddleware} from '@/services/server/core';
import {resetSetupForDevelopment} from '@/server/setup/service';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    try {
        await resetSetupForDevelopment();
        return res.status(200).json({message: 'Guide de configuration réactivé'});
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.message || 'Reset impossible',
            details: process.env.NODE_ENV === 'development' ? error.stack : null,
        });
    }
}
