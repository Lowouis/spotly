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
        const validationResult = await validateKerberosTicket(ticket);
        if (!validationResult || !validationResult.username) {
            return res.status(401).json({error: "Ticket Kerberos invalide"});
        }

        let user = await prisma.user.findUnique({
            where: {username: validationResult.username},
        });

        if (!user) {
            const ldapConfig = await prisma.ldapConfig.findFirst({
                where: {isActive: true},
                orderBy: {lastUpdated: 'desc'}
            });

            if (!ldapConfig || !ldapConfig.emailDomain) {
                return res.status(500).json({error: "La configuration du domaine de messagerie est manquante."});
            }
            const emailDomain = decrypt(ldapConfig.emailDomain);

            // Logique de création de l'utilisateur si non trouvé (peut être étendue avec LDAP)
            user = await prisma.user.create({
                data: {
                    username: validationResult.username,
                    email: `${validationResult.username}@${emailDomain}`,
                    external: true,
                },
            });
        }

        return res.status(200).json(user);

    } catch (error) {
        console.error("Erreur lors de la validation Kerberos ou de l'accès DB:", error);
        return res.status(500).json({error: "Erreur interne du serveur"});
    }
} 