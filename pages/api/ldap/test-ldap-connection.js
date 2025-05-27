import {ldapConnectionTest} from '@/lib/ldap-utils';
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'POST') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const {serverUrl, bindDn, adminCn, adminPassword} = req.body;
    if (!serverUrl || !bindDn || !adminCn || !adminPassword) {
        return res.status(400).json({message: 'Tous les champs sont requis'});
    }

    try {
        const ldapConfig = {
            url: serverUrl,
            bindDN: bindDn,
            bindCredentials: adminPassword,
            adminCn: adminCn,
            username: adminCn // Pour le test, on utilise le même utilisateur
        };

        const connectionResult = await ldapConnectionTest(ldapConfig);

        if (!connectionResult.success) {
            return res.status(401).json({
                message: 'Échec de la connexion LDAP',
                details: connectionResult.error
            });
        }

        return res.status(200).json({
            message: 'Connexion LDAP réussie'
        });

    } catch (error) {
        console.error('LDAP connection test error:', error);
        return res.status(500).json({
            message: 'Erreur lors du test de connexion',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
} 