export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({message: 'Method not allowed'});
    }

    const authHeader = req.headers.authorization;
    const isSSO = authHeader?.startsWith('Negotiate ');

    return res.status(200).json({isSSO});
} 