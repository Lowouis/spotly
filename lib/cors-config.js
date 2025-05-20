// Configuration centralisée pour CORS
const allowedOrigins = [
    'http://intranet:3000',
    'http://intranet.fhm.local:3000',
    'http://localhost:3000',
    'http://spotly.fhm.local',
    'http://spotly.fhm.local:3000',
    'http://sso.intranet.fhm.local/spotly',
    "http://127.0.0.1:3000",
    "http://spotly"
];

const corsOptions = {
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
};


module.exports = {
    allowedOrigins,
    corsOptions,
};