import {signIn} from 'next-auth/react';

export default async function handler(req, res) {
    console.log('Kerberos callback handler called');
    
    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        console.log('Invalid method:', req.method);
        return res.status(405).json({message: 'Method not allowed'});
    }

    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader?.startsWith('Negotiate ')) {
        console.log('No Kerberos ticket in header');
        return res.status(401).json({message: 'No Kerberos ticket provided'});
    }

    const ticket = authHeader.substring('Negotiate '.length);
    console.log('Kerberos ticket extracted, attempting sign in...');

    try {
        const result = await signIn('kerberos', {
            redirect: false,
            ticket: ticket
        });
        console.log('Sign in result:', result);

        if (result?.error) {
            console.log('Sign in error:', result.error);
            return res.status(401).json({message: result.error});
        }

        console.log('Sign in successful');
        return res.status(200).json({success: true});
    } catch (error) {
        console.error('Kerberos authentication error:', error);
        return res.status(500).json({message: 'Internal server error'});
    }
} 