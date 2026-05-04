import {requestPasswordReset} from '@/services/server/password-reset';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    try {
        const result = await requestPasswordReset(req);
        return res.status(result.status).json(result.body);
    } catch (error) {
        console.error('Password reset request failed:', error);
        return res.status(200).json({message: 'Si un compte interne existe pour cet identifiant, un email de récupération va être envoyé.'});
    }
}
