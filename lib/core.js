import Cors from 'cors';

// Initialize the CORS middleware
const cors = Cors({
    methods: ['GET', 'POST', 'OPTIONS'], // Specify the allowed methods
    origin: '*',
});

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