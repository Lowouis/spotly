import prisma from "@/prismaconf/init";
import {runMiddleware} from "@/lib/core";
import {encrypt} from '@/lib/security';
import {validateSmtpConfig} from '@/lib/smtp-utils';

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const {host, port, username, password, fromEmail, fromName, secure} = req.body;
    if (!host || !port || !username || !fromEmail || !fromName) {
        return res.status(400).json({message: 'Tous les champs sont requis'});
    }

    try {
        // 1. Validation de la configuration SMTP
        const config = {
            host,
            port,
            username,
            password,
            fromEmail,
            fromName,
            secure: secure ?? true
        };

        const validationResult = await validateSmtpConfig(config);
        if (!validationResult.success) {
            return res.status(401).json({
                message: 'Configuration SMTP invalide',
                details: validationResult.error
            });
        }

        // 2. Chiffrement des données sensibles
        const encryptedData = {
            host: encrypt(host),
            port: encrypt(port),
            username: encrypt(username),
            password: encrypt(password),
            fromEmail: encrypt(fromEmail),
            fromName: encrypt(fromName),
            secure: secure ?? true
        };

        // 3. Désactiver toutes les configurations existantes
        await prisma.smtpConfig.updateMany({
            where: {isActive: true},
            data: {isActive: false}
        });

        // 4. Sauvegarder la nouvelle configuration
        const savedConfig = await prisma.smtpConfig.create({
            data: {
                ...encryptedData,
                lastUpdated: new Date(),
                updatedBy: req.session?.user?.name || 'system'
            }
        });

        return res.status(200).json({
            message: 'Configuration sauvegardée avec succès',
            id: savedConfig.id
        });

    } catch (error) {
        console.error('SMTP config save error:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            message: 'Erreur lors de la sauvegarde de la configuration',
            details: error.message,
            stack: error.stack,
            errorName: error.name
        });
    }
} 