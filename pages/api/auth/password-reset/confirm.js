import {confirmPasswordReset} from '@/services/server/password-reset';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    try {
        const result = await confirmPasswordReset(req);
        return res.status(result.status).json(result.body);
    } catch (error) {
        console.error('Password reset confirmation failed:', error);
        return res.status(500).json({message: 'Erreur interne du serveur'});
    }
}
