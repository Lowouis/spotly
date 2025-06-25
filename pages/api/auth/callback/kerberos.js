import {validateKerberosTicket} from "@/lib/kerberos-auth";
import prisma from "@/prismaconf/init";
import {decrypt} from "@/lib/security";

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        return res.status(405).end();
    }

    const {ticket} = req.body;
    if (!ticket) {
        return res.status(400).json({error: "Ticket manquant"});
    }

    try {
        console.log("Callback Kerberos: Début de la validation du ticket.");
        const validationResult = await validateKerberosTicket(ticket);
        console.log("Callback Kerberos: Résultat de la validation:", validationResult);

        if (!validationResult || !validationResult.username || !validationResult.success) {
            console.error("Callback Kerberos: Échec de la validation du ticket.");
            return res.status(401).json({error: "Ticket Kerberos invalide"});
        }

        console.log(`Callback Kerberos: Ticket validé pour l'utilisateur ${validationResult.username}. Recherche en BDD.`);
        let user = await prisma.user.findUnique({
            where: {username: validationResult.username},
        });
        console.log(`Callback Kerberos: Utilisateur trouvé en BDD:`, user);

        if (!user) {
            console.log(`Callback Kerberos: L'utilisateur n'existe pas. Tentative de création.`);
            const ldapConfig = await prisma.ldapConfig.findFirst({
                where: {isActive: true},
                orderBy: {lastUpdated: 'desc'}
            });

            if (!ldapConfig || !ldapConfig.emailDomain) {
                console.error("Callback Kerberos: Configuration du domaine de messagerie manquante.");
                return res.status(500).json({error: "La configuration du domaine de messagerie est manquante."});
            }
            const emailDomain = decrypt(ldapConfig.emailDomain);
            console.log(`Callback Kerberos: Domaine de messagerie utilisé: ${emailDomain}`);

            // Logique de création de l'utilisateur si non trouvé (peut être étendue avec LDAP)
            user = await prisma.user.create({
                data: {
                    username: validationResult.username,
                    email: `${validationResult.username}@${emailDomain}`,
                    external: true,
                },
            });
            console.log(`Callback Kerberos: Utilisateur créé:`, user);
        }

        console.log("Callback Kerberos: Renvoi de l'utilisateur au client.");
        return res.status(200).json(user);

    } catch (error) {
        console.error("Erreur majeure dans le callback Kerberos:", error);
        return res.status(500).json({error: "Erreur interne du serveur"});
    }
} 