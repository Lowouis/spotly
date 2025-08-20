import {runMiddleware} from '@/lib/core';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const {date} = req.query;

    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({message: 'Format de date invalide. Utilisez YYYY-MM-DD.'});
    }

    const filename = `cron-${date}.log`;
    const logsDir = path.join(process.cwd(), 'logs');
    const filePath = path.join(logsDir, filename);

    try {
        await fs.access(filePath);
    } catch (e) {
        return res.status(404).json({message: `Aucun fichier pour la date ${date} n'existe.`});
    }

    try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split(/\r?\n/);
        return res.status(200).json({date, filename, lines});
    } catch (error) {
        console.error('Log read error:', error);
        return res.status(500).json({message: 'Erreur lors de la lecture du fichier de logs.'});
    }
} 