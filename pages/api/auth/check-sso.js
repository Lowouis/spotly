export default async function handler(req, res) {
    console.log('Check-SSO endpoint called');
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request method:', req.method);

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
    
    const isSSO = authHeader?.startsWith('Negotiate ');
    console.log('Is SSO:', isSSO);

    // Vérification plus détaillée de l'en-tête d'autorisation
    let authDetails = {
        hasHeader: false,
        headerType: null,
        isValidFormat: false,
        ticketPresent: false
    };

    if (authHeader) {
        authDetails.hasHeader = true;
        const [type, ticket] = authHeader.split(' ');
        authDetails.headerType = type;
        authDetails.isValidFormat = type === 'Negotiate';
        authDetails.ticketPresent = !!ticket;
    }

    // Vérification des cookies de session
    const sessionCookie = req.cookies['next-auth.session-token'];
    console.log('Session cookie present:', !!sessionCookie);

    // Vérification de l'origine de la requête
    const origin = req.headers.origin || req.headers.referer;
    console.log('Request origin:', origin);

    return res.status(200).json({
        isSSO,
        status: isSSO ? 'pending' : 'not_authenticated',
        debug: {
            auth: authDetails,
            session: {
                cookiePresent: !!sessionCookie,
                cookieName: sessionCookie ? 'next-auth.session-token' : null
            },
            request: {
                origin,
                method: req.method,
                headers: Object.keys(req.headers),
                timestamp: new Date().toISOString()
            }
        }
    });
} 