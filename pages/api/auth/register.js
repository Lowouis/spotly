import prisma from '@/prismaconf/init';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { username, name, surname, email, password } = req.body;

    if (!username || !email || !password || !name || !surname) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Un utilisateur avec ce nom d\'utilisateur ou cet email existe déjà' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const user = await prisma.user.create({
            data: {
                username,
                name,
                surname,
                email,
                password: hashedPassword,
                external: false, // Compte interne
            }
        });

        return res.status(201).json({ message: 'Utilisateur créé avec succès', userId: user.id });

    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
} 