import {runMiddleware} from "@/lib/core";
import {initializeKerberos} from "@/lib/kerberos-auth";
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    console.log('--- NOUVELLE VERSION DE CHECK-SSO.JS EXÉCUTÉE ---');
    await runMiddleware(req, res);

    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
        return res.status(405).json({
            message: 'Method not allowed'
        });
    }

    try {
        const config = await prisma.kerberosConfig.findFirst({
            where: {isActive: true},
            orderBy: {lastUpdated: 'desc'}
        });

        if (!config) {
            return res.status(503).json({message: 'Configuration Kerberos non disponible'});
        }

        // Initialiser Kerberos avec la configuration chargée
        await initializeKerberos(config);

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

    } catch (error) {
        console.error("Erreur dans check-sso:", error);
        return res.status(500).json({message: "Erreur interne du serveur lors de la vérification SSO", error: error.message});
    }
} 