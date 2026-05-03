import {runMiddleware} from '@/services/server/core';
import {checkDatabaseConnection} from '@/server/setup/service';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    try {
        return res.status(200).json(await checkDatabaseConnection());
    } catch (error) {
        return res.status(200).json({
            ok: false,
            provider: 'mysql',
            databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
            message: 'Connexion à la base impossible',
            details: process.env.NODE_ENV === 'development' ? error.message : null,
        });
    }
}
