import {getServerSession} from "next-auth/next";
import authConfig from "../../auth/[...nextauth]";
import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    try {
        await runMiddleware(req, res);

        const session = await getServerSession(req, res, authConfig);

        if (!session) {
            return res.status(401).json({details: "Non autorisé"});
        }

        const {groupId} = req.query;

        if (!groupId) {
            return res.status(400).json({details: "ID du groupe manquant"});
        }

        if (req.method === "DELETE") {
            try {
                const entries = await prisma.entry.findMany({
                    where: {
                        recurringGroupId: parseInt(groupId)
                    },
                    include: {
                        user: true,
                        resource: {
                            include: {
                                owner: true
                            }
                        }
                    }
                });

                if (!entries.length) {
                    return res.status(404).json({details: "Groupe de réservations non trouvé"});
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: session.user.email
                    }
                });


                const isAuthorized = entries.every(entry => {
                    const isUserAuthorized = entry.user.email === user.email;
                    const isAdmin = user.role === "SUPERADMIN";
                    const isOwner = entry.resource.owner?.email === user.email;
                    return isUserAuthorized || isAdmin || isOwner;
                });

                if (!isAuthorized) {
                    return res.status(403).json({details: "Non autorisé à annuler ces réservations"});
                }


                // Supprimer toutes les entrées du groupe
                await prisma.entry.deleteMany({
                    where: {
                        recurringGroupId: parseInt(groupId)
                    }
                });

                return res.status(200).json({
                    message: "Groupe de réservations annulé avec succès",
                    entries: entries
                });

            } catch (error) {
                console.error("Erreur détaillée lors de l'annulation du groupe:", {
                    message: error.message,
                    stack: error.stack,
                    code: error.code
                });
                return res.status(500).json({
                    details: "Erreur lors de l'annulation du groupe de réservations",
                    error: error.message
                });
            }
        }

        return res.status(405).json({details: "Méthode non autorisée"});
    } catch (error) {
        console.error("Erreur globale:", {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return res.status(500).json({
            details: "Erreur serveur",
            error: error.message
        });
    }
} 