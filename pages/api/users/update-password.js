import {getServerSession} from "next-auth/next";
import prisma from '@/prismaconf/init';
import bcrypt from "bcrypt";

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

        const {password} = req.body;

        // Validation du mot de passe
        if (!password || password.length < 8) {
            return res.status(400).json({message: 'Le mot de passe doit contenir au moins 8 caractères'});
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(password, 12);

        // Mettre à jour le mot de passe en utilisant l'email
        const updatedUser = await prisma.user.update({
            where: {email: session.user.email},
            data: {password: hashedPassword}
        });

        res.status(200).json({
            message: 'Mot de passe mis à jour avec succès',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                surname: updatedUser.surname,
                role: updatedUser.role
            }
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du mot de passe:', error);
        res.status(500).json({message: 'Erreur interne du serveur'});
    }
}
