import {ldapConnectionTest} from '@/services/server/ldap-utils';
import {runMiddleware} from "@/services/server/core";
import {requireAdmin} from '@/services/server/api-auth';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if(req.method === 'OPTIONS'){
        return res.status(200).json({message: 'OK'});
    }
    if (!await requireAdmin(req, res)) return;


    const {serverUrl, bindDn, adminCn, adminDn, adminPassword} = req.body;
    if (!serverUrl || !bindDn || !adminCn || !adminDn || !adminPassword) {
        return res.status(400).json({message: 'Tous les champs sont requis'});
    }

    try {
        const ldapConfig = {
            url: serverUrl,
            bindDN: bindDn,
            bindCredentials: adminPassword,
            adminCn: adminCn,
            adminDn: adminDn,
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
