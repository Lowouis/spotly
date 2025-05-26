import {runMiddleware} from "@/lib/core";

export default async function handler(req, res) {
    await runMiddleware(req, res);

    if (req.method !== 'GET') {
        console.log('Invalid method:', req.method);
        return res.status(405).json({
            message: 'Method not allowed',
            details: {
                method: req.method,
                allowed: 'GET'
            }
        });
    }

    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    if (!authHeader) {
        return res.status(401).json({
            message: 'Authorization header missing',
            status: 'not_authenticated'
        });
    }

    const [type, ticket] = authHeader.split(' ');
    if (type !== 'Negotiate' || !ticket) {
        return res.status(401).json({
            message: 'Invalid authorization header format',
            status: 'not_authenticated'
        });
    }

    return res.status(200).json({
        isSSO: true,
        status: 'pending',
        debug: {
            auth: {
                hasHeader: true,
                headerType: type,
                isValidFormat: true,
                ticketPresent: true
            },
            request: {
                method: req.method,
                headers: Object.keys(req.headers),
                timestamp: new Date().toISOString()
            }
        }
    });
} 