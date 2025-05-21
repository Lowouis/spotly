import {signIn} from 'next-auth/react';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Negotiate ')) {
        return res.status(401).json({message: 'No Kerberos ticket provided'});
    }

    const ticket = authHeader.substring('Negotiate '.length);

    try {
        const result = await signIn('kerberos', {
            redirect: false,
            ticket: ticket
        });

        if (result?.error) {
            return res.status(401).json({message: result.error});
        }

        return res.status(200).json({success: true});
    } catch (error) {
        console.error('Kerberos authentication error:', error);
        return res.status(500).json({message: 'Internal server error'});
    }
} 