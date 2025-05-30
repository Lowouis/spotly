import {runMiddleware} from "@/lib/core";
import kerberos from 'kerberos';
import prisma from "@/prismaconf/init";
import {exec} from 'child_process';
import {promisify} from 'util';

// Promisifier la fonction exec
const execPromise = promisify(exec);

// Fonction utilitaire pour envelopper initializeServer dans une Promesse
function initializeKerberosServer(serviceName) {
    return new Promise((resolve, reject) => {
        // Utiliser la signature simple (service, callback)
        // Passer uniquement le nom du service, le realm devrait être trouvé via l'environnement
        kerberos.initializeServer(serviceName, (err, serverInstance) => {
            if (err) {
                return reject(err);
            }
            resolve(serverInstance);
        });
    });
}

export default async function handler(req, res) {
    // --- Début du test kinit ---
    console.log('[/api/auth/check-sso] - Exécution du test kinit...');
    const kinitCommand = `kinit -k -t ${process.env.KRB5_KTNAME || process.env.KERBEROS_KEYTAB_PATH} ${process.env.KERBEROS_PRINCIPAL} || echo "kinit failed"`;
    try {
        const {stdout, stderr} = await execPromise(kinitCommand);
        if (stdout.includes('kinit failed') || stderr) {
            console.error('[/api/auth/check-sso] - Test kinit échoué:', stderr || stdout);
            console.warn('[/api/auth/check-sso] - Cela peut indiquer un problème avec le keytab ou les permissions, ou le principal côté KDC.');
        } else {
            console.log('[/api/auth/check-sso] - Test kinit réussi.');
        }
    } catch (error) {
        console.error('[/api/auth/check-sso] - Erreur lors de l\'exécution de kinit:', error);
        console.warn('[/api/auth/check-sso] - Assurez-vous que la commande kinit est disponible et que l\'environnement est correct.');
    }
    console.log('[/api/auth/check-sso] - Fin du test kinit.');
    // --- Fin du test kinit ---

    await runMiddleware(req, res);

    console.log('[/api/auth/check-sso] - Reçu');
    console.log('[/api/auth/check-sso] - Headers:', JSON.stringify(req.headers, null, 2));

    if (req.method !== 'GET') {
        console.log('[/api/auth/check-sso] - Méthode invalide:', req.method);
        return res.status(405).json({
            message: 'Method not allowed',
            details: {
                method: req.method,
                allowed: 'GET'
            }
        });
    }

    const authHeader = req.headers.authorization;
    console.log('[/api/auth/check-sso] - En-tête Authorization:', authHeader ? 'Présent' : 'Absent');

    if (!authHeader || !authHeader.startsWith('Negotiate ')) {
        console.log('[/api/auth/check-sso] - En-tête Authorization Negotiate manquant ou mal formaté');
        console.log('[/api/auth/check-sso] - Configuration Kerberos:');
        console.log('- Service Name:', process.env.KERBEROS_SERVICE_NAME);
        console.log('- Realm:', process.env.KERBEROS_REALM);
        console.log('- Keytab Path:', process.env.KERBEROS_KEYTAB_PATH);
        console.log('- Principal:', process.env.KERBEROS_PRINCIPAL);
        
        res.setHeader('WWW-Authenticate', 'Negotiate');
        return res.status(401).json({
            message: 'Authentification Negotiate requise',
            status: 'negotiate_required',
            debug: {
                headers: req.headers,
                kerberosConfig: {
                    serviceName: process.env.KERBEROS_SERVICE_NAME,
                    realm: process.env.KERBEROS_REALM,
                    keytabPath: process.env.KERBEROS_KEYTAB_PATH,
                    principal: process.env.KERBEROS_PRINCIPAL
                }
            }
        });
    }

    // Extraire le ticket (base64) de l'en-tête
    const ticket = authHeader.split(' ')[1];
    console.log('[/api/auth/check-sso] - Ticket reçu (base64):', ticket ? ticket.substring(0, 20) + '...' : 'Aucun');

    let userPrincipal = null;
    let authenticated = false;
    let responseToken = null;

    try {
        console.log('[/api/auth/check-sso] - Tentative d\'initialisation du serveur Kerberos...');
        // Extraire le nom du service du principal complet
        const serviceName = process.env.KERBEROS_PRINCIPAL.split('@')[0];
        // Initialiser le serveur Kerberos en utilisant la fonction wrapper basée sur Promesse et en passant uniquement le nom du service.
        const server = await initializeKerberosServer(serviceName);
        console.log('[/api/auth/check-sso] - Serveur Kerberos initialisé avec succès');

        console.log('[/api/auth/check-sso] - Tentative de validation du ticket...');
        // Valider le ticket. Les détails du keytab/principal devraient être déjà chargés via l'initialisation.
        const result = await server.step(ticket);

        console.log('[/api/auth/check-sso] - Résultat de la validation:', result);
        
        if (result.success) {
            authenticated = true;
            // Le principal de l'utilisateur authentifié devrait être retourné ici (ex: utilisateur@REALM)
            userPrincipal = result.username;
            responseToken = result.responseToken;
            
            console.log('[/api/auth/check-sso] - Authentification Kerberos réussie pour', userPrincipal);
        } else {
            console.error('[/api/auth/check-sso] - Échec de la validation du ticket:', result);
            throw new Error('Échec de la validation du ticket Kerberos: ' + JSON.stringify(result));
        }

    } catch (kerberosError) {
        console.error('[/api/auth/check-sso] - Erreur détaillée lors de la validation Kerberos:', {
            message: kerberosError.message,
            stack: kerberosError.stack,
            config: {
                serviceName: process.env.KERBEROS_SERVICE_NAME,
                realm: process.env.KERBEROS_REALM,
                keytabPath: process.env.KERBEROS_KEYTAB_PATH,
                principal: process.env.KERBEROS_PRINCIPAL
            }
        });
        res.setHeader('WWW-Authenticate', 'Negotiate');
        return res.status(401).json({
            message: 'Échec de l\'authentification Kerberos',
            status: 'authentication_failed',
            details: kerberosError.message,
            debug: {
                error: kerberosError.message,
                stack: kerberosError.stack,
                config: {
                    serviceName: process.env.KERBEROS_SERVICE_NAME,
                    realm: process.env.KERBEROS_REALM,
                    keytabPath: process.env.KERBEROS_KEYTAB_PATH,
                    principal: process.env.KERBEROS_PRINCIPAL
                }
            }
        });
    }

    // --- Étape de mapping et d'authentification de l'utilisateur dans l'application ---
    if (authenticated && userPrincipal) {
        try {
            // Chercher l'utilisateur dans la base de données par son principal
            let user = await prisma.user.findUnique({
                where: {username: userPrincipal.split('@')[0]},
            });

            // Si l'utilisateur n'existe pas, on le crée
            if (!user) {
                console.log('[/api/auth/check-sso] - Utilisateur non trouvé, création...', userPrincipal);
                user = await prisma.user.create({
                    data: {
                        username: userPrincipal.split('@')[0],
                        email: `${userPrincipal.split('@')[0]}@${userPrincipal.split('@')[1].toLowerCase()}`,
                        external: true,
                        role: 'USER', // Rôle par défaut
                        active: true
                    }
                });
                console.log('[/api/auth/check-sso] - Utilisateur créé:', user.username);
            }

            // Si un responseToken est disponible, l'ajouter à la réponse
            if (responseToken) {
                res.setHeader('WWW-Authenticate', `Negotiate ${responseToken}`);
            }

            // Renvoyer la réponse avec les informations utilisateur
            return res.status(200).json({
                message: 'Authentification SSO réussie',
                status: 'authenticated',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    email: user.email
                }
            });

        } catch (dbError) {
            console.error('[/api/auth/check-sso] - Erreur base de données:', dbError);
            return res.status(500).json({
                message: 'Échec de l\'authentification SSO',
                status: 'server_error',
                details: dbError.message
            });
        }
    } else {
        console.log('[/api/auth/check-sso] - Authentification non réussie après validation');
        res.setHeader('WWW-Authenticate', 'Negotiate');
        return res.status(401).json({
            message: 'Échec de l\'authentification SSO',
            status: 'authentication_failed_internal'
        });
    }
} 