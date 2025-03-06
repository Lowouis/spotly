import {IncomingForm} from 'formidable';
import fs from 'fs';
import path from 'path';
import {runMiddleware} from "@/lib/core";

// Désactiver le parsing automatique du body par Next.js
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {

    await runMiddleware(req, res);

    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
        return res.status(405).json({status: 'error', message: 'Méthode non autorisée'});
    }

    try {
        // Utiliser formidable pour parser le FormData
        const form = new IncomingForm({
            keepExtensions: true,
            maxFileSize: 5 * 1024 * 1024, // 5 Mo
        });

        // Promisify le parsing du form
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        // Récupérer le fichier banner
        const file = files.banner[0];

        // Validation du type de fichier
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.mimetype)) {
            return res.status(400).json({
                status: 'error',
                message: 'Format de fichier non supporté. Utiliser JPEG, PNG ou WEBP.'
            });
        }

        // Chemin destination pour la bannière
        const publicPath = path.join(process.cwd(), 'public');
        const destinationPath = path.join(publicPath, 'banner.png');

        // Copier le fichier vers sa destination finale
        await fs.promises.copyFile(file.filepath, destinationPath);

        // Supprimer le fichier temporaire
        await fs.promises.unlink(file.filepath);

        // Renvoyer une réponse de succès
        return res.status(200).json({
            status: 'success',
            message: 'Bannière mise à jour avec succès',
            path: '/banner.png'
        });

    } catch (error) {
        console.error('Erreur lors de l\'upload de la bannière:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Une erreur est survenue lors du traitement du fichier'
        });
    }
}