import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    console.log('--- NOUVELLE VERSION DE CHECK-SSO.JS EXÉCUTÉE ---');
    await runMiddleware(req, res);

    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        return res.status(405).json({
            message: 'Method not allowed'
        });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Negotiate ')) {
        res.setHeader('WWW-Authenticate', 'Negotiate');
        return res.status(401).json({message: 'Authentification Negotiate requise'});
    }

    const ticket = authHeader.split(' ')[1];

    if (!ticket) {
        return res.status(400).json({message: 'En-tête Negotiate mal formaté'});
    }

    return res.status(200).json({ticket});
} 