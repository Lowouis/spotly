import {runMiddleware} from '@/lib/core';
import fs from 'fs/promises';
import path from 'path';

function isCronLog(filename) {
    return /^cron-\d{4}-\d{2}-\d{2}\.log$/.test(filename);
}

function compareDesc(a, b) {
    // Sort by date desc based on filename cron-YYYY-MM-DD.log
    const da = a.match(/cron-(\d{4}-\d{2}-\d{2})\.log$/)?.[1] || '';
    const db = b.match(/cron-(\d{4}-\d{2}-\d{2})\.log$/)?.[1] || '';
    return db.localeCompare(da);
}

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const logsDir = path.join(process.cwd(), 'logs');
    try {
        const entries = await fs.readdir(logsDir, {withFileTypes: true});
        const files = entries
            .filter((e) => e.isFile())
            .map((e) => e.name)
            .filter(isCronLog)
            .sort(compareDesc);

        return res.status(200).json({files});
    } catch (error) {
        // If directory doesn't exist or other fs error
        return res.status(200).json({files: []});
    }
} 