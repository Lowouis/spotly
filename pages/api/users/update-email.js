import {getServerSession} from "next-auth/next";
import prisma from '@/prismaconf/init';

// Configuration NextAuth
const authConfig = {
    secret: process.env.AUTH_SECRET,
    providers: [],
    session: {
        strategy: "jwt",
    },
};

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    try {
        // Vérifier la session
        const session = await getServerSession(req, res, authConfig);
        if (!session) {
            return res.status(401).json({message: 'Non autorisé'});
        }

        const {email} = req.body;

        // Validation de l'email
        if (!email || !email.includes('@')) {
            return res.status(400).json({message: 'Adresse email invalide'});
        }

        // Vérifier si l'email est le même que l'actuel
        if (email === session.user.email) {
            return res.status(400).json({message: 'Cette adresse email est déjà la vôtre'});
        }

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        const existingUser = await prisma.user.findFirst({
            where: {
                email: email
            }
        });

        if (existingUser) {
            return res.status(400).json({message: 'Cette adresse email est déjà utilisée'});
        }

        // Mettre à jour l'email en utilisant l'email actuel
        const updatedUser = await prisma.user.update({
            where: {email: session.user.email},
            data: {email: email}
        });

        res.status(200).json({
            message: 'Email mis à jour avec succès',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                surname: updatedUser.surname,
                role: updatedUser.role
            }
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'email:', error);
        res.status(500).json({message: 'Erreur interne du serveur'});
    }
}
