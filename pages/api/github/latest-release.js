import {runMiddleware} from '@/services/server/core';
import {requireAdmin} from '@/services/server/api-auth';

const repository = 'Lowouis/spotly';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    if (!await requireAdmin(req, res)) return;

    try {
        const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
            headers: {
                Accept: 'application/vnd.github+json',
                'User-Agent': 'spotly-version-check',
            },
        });

        if (response.status === 404) {
            return res.status(200).json({available: false, message: 'Aucune release publiée'});
        }

        if (!response.ok) {
            return res.status(response.status).json({message: 'Impossible de vérifier la dernière release'});
        }

        const release = await response.json();
        return res.status(200).json({
            available: true,
            tagName: release.tag_name,
            name: release.name,
            htmlUrl: release.html_url,
            publishedAt: release.published_at,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Erreur lors de la vérification GitHub',
            details: process.env.NODE_ENV === 'development' ? error.message : null,
        });
    }
}
