// lib/cors.js
import Cors from 'cors';

// Initialisez CORS
const cors = Cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    origin: '*', // Autoriser toutes les origines
    // origin: 'https://votre-domaine.com', // Autoriser une origine spécifique
});

// Helper pour exécuter le middleware
export function runMiddleware(req, res) {
    return new Promise((resolve, reject) => {
        cors(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}
