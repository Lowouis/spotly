import Cors from 'cors';
import {corsOptions} from '@/lib/cors-config';

// Initialize the CORS middleware with centralized config
const cors = Cors(corsOptions);

// Helper method to wait for a middleware to execute before continuing
const runMiddleware = (req, res) => {
    return new Promise((resolve, reject) => {
        cors(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
};

export { runMiddleware };