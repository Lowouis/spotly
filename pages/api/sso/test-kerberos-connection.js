import {runMiddleware} from "@/lib/core";
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const {realm, kdc, adminServer, defaultDomain, serviceHost, keytabPath} = req.body;
    if (!realm || !kdc || !adminServer || !defaultDomain || !serviceHost || !keytabPath) {
        return res.status(400).json({message: 'Tous les champs sont requis'});
    }

    try {
        const principal = `HTTP/${serviceHost}@${realm}`;
        const kinitCommand = `kinit -k -t ${keytabPath} ${principal}`;

        console.log(`[test-kerberos-connection] - Exécution du test : ${kinitCommand}`);

        const { stdout, stderr } = await execPromise(kinitCommand);

        if (stderr) {
            console.error(`[test-kerberos-connection] - Échec de kinit :`, stderr);
            return res.status(401).json({
                message: 'Échec du test de connexion Kerberos',
                details: stderr
            });
        }
        
        await execPromise(`kdestroy`);

        return res.status(200).json({
            message: 'Connexion Kerberos réussie'
        });

    } catch (error) {
        console.error('Kerberos connection test error:', error);
        return res.status(500).json({
            message: 'Erreur lors du test de connexion',
            details: error.message || 'Une erreur inattendue est survenue.'
        });
    }
} 