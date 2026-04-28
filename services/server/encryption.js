import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Vérifie si les clés de chiffrement doivent être rotées et les rotate si nécessaire
 * @returns {boolean} - true si une rotation a été effectuée
 */
function rotateEncryptionKeysIfNeeded() {
    try {
        // Chemin vers le fichier de métadonnées des clés
        const keyMetadataPath = path.join(process.cwd(), '.keys', 'metadata.json');

        // Vérifie si le dossier existe, sinon le crée
        const keyDir = path.join(process.cwd(), '.keys');
        if (!fs.existsSync(keyDir)) {
            fs.mkdirSync(keyDir, {recursive: true});
        }

        // Chargement des métadonnées ou création si n'existent pas
        let metadata = {lastRotation: 0, currentKeyId: 'key1'};
        if (fs.existsSync(keyMetadataPath)) {
            metadata = JSON.parse(fs.readFileSync(keyMetadataPath, 'utf-8'));
        }

        const now = Date.now();
        const daysSinceLastRotation = (now - metadata.lastRotation) / (1000 * 60 * 60 * 24);

        // Rotation tous les 90 jours
        if (daysSinceLastRotation < 90 && metadata.lastRotation !== 0) {
            return false; // Pas besoin de rotation
        }

        // Génération d'une nouvelle clé
        const newKeyId = `key${Date.now()}`;
        const newKey = crypto.randomBytes(32).toString('hex');

        // Sauvegarde de l'ancienne clé et ajout de la nouvelle
        const keysPath = path.join(keyDir, 'keys.json');
        let keys = {};

        if (fs.existsSync(keysPath)) {
            keys = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));
        }

        // Ajout de la nouvelle clé
        keys[newKeyId] = newKey;

        // Mise à jour des fichiers
        fs.writeFileSync(keysPath, JSON.stringify(keys), 'utf-8');
        fs.writeFileSync(
            keyMetadataPath,
            JSON.stringify({
                lastRotation: now,
                currentKeyId: newKeyId,
                previousKeyId: metadata.currentKeyId
            }),
            'utf-8'
        );

        return true;

    } catch (error) {
        console.error("Erreur lors de la rotation des clés:", error);
        return false;
    }
}

export {rotateEncryptionKeysIfNeeded};