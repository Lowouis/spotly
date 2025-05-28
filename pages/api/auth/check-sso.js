import {runMiddleware} from "@/lib/core";
import kerberos from 'kerberos';
import prisma from "@/prismaconf/init";

export default async function handler(req, res) {
    await runMiddleware(req, res);

    console.log('[/api/auth/check-sso] - Reçu');

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
        res.setHeader('WWW-Authenticate', 'Negotiate');
        return res.status(401).json({
            message: 'Authentification Negotiate requise',
            status: 'negotiate_required'
        });
    }

    // Extraire le ticket (base64) de l'en-tête
    const ticket = authHeader.split(' ')[1];
    console.log('[/api/auth/check-sso] - Ticket reçu (base64):', ticket ? ticket.substring(0, 20) + '...' : 'Aucun');

    let userPrincipal = null;
    let authenticated = false;
    let responseToken = null;

    try {
        // Initialiser le serveur Kerberos avec les variables d'environnement spécifiques
        const server = await kerberos.initializeServer(
            process.env.KERBEROS_SERVICE_NAME, // HTTP/sso.intranet.fhm.local
            process.env.KERBEROS_REALM,        // FHM.LOCAL
            {
                keytab: process.env.KERBEROS_KEYTAB_PATH, // /etc/apache2/fhm.keytab
                principal: process.env.KERBEROS_PRINCIPAL  // HTTP/sso.intranet.fhm.local@FHM.LOCAL
            }
        );

        // Valider le ticket
        const result = await server.step(ticket);

        if (result.success) {
            authenticated = true;
            userPrincipal = result.username; // Le principal de l'utilisateur authentifié
            responseToken = result.responseToken; // Token de réponse si nécessaire

            console.log('[/api/auth/check-sso] - Authentification Kerberos réussie pour', userPrincipal);
        } else {
            throw new Error('Échec de la validation du ticket Kerberos');
        }

    } catch (kerberosError) {
        console.error('[/api/auth/check-sso] - Erreur lors de la validation Kerberos:', kerberosError);
        res.setHeader('WWW-Authenticate', 'Negotiate');
        return res.status(401).json({
            message: 'Échec de l\'authentification Kerberos',
            status: 'authentication_failed',
            details: kerberosError.message
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
                message: 'Erreur serveur lors de l\'authentification',
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