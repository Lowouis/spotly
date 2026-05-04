import db from "@/server/services/databaseService";
import bcrypt from 'bcrypt';
import {rateLimit} from '@/services/server/api-auth';

function passwordValidationError(password) {
    if (typeof password !== 'string' || password.length < 12) {
        return 'Le mot de passe doit contenir au moins 12 caractères';
    }
    if (password.length > 128) {
        return 'Le mot de passe ne doit pas dépasser 128 caractères';
    }
    if (!/[a-z]/.test(password)) return 'Le mot de passe doit contenir au moins une minuscule';
    if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une majuscule';
    if (!/[0-9]/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Le mot de passe doit contenir au moins un caractère spécial';
    return null;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    if (!rateLimit(req, res, {key: 'auth:register', limit: 5, windowMs: 60_000})) return;

    const { username, name, surname, email, password } = req.body;

    if (!username || !email || !password || !name || !surname) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const passwordError = passwordValidationError(password);
    if (passwordError) {
        return res.status(400).json({message: passwordError});
    }

    try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await db.user.findFirst({
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
        const hashedPassword = await bcrypt.hash(password, 12);

        // Créer l'utilisateur
        const user = await db.user.create({
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
