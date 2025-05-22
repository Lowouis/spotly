import {getToken} from "next-auth/jwt";
import {NextResponse} from "next/server";

const allowedOrigins = [
    'http://intranet:3000',
    'http://intranet.fhm.local:3000',
    'http://localhost:3000',
    'http://spotly.fhm.local',
    'http://spotly.fhm.local:3000',
    'http://sso.intranet.fhm.local',
    "http://127.0.0.1:3000",
    "http://spotly"
];

export async function middleware(req) {
    console.log('=== MIDDLEWARE DEBUG ===');
    console.log('Middleware appelé pour:', req.nextUrl.pathname);
    console.log('Origin:', req.headers.get('origin'));
    console.log('Referer:', req.headers.get('referer'));
    console.log('Method:', req.method);
    console.log('URL complète:', req.url);

    // Log de tous les headers pour debug
    const allHeaders = Object.fromEntries(req.headers.entries());
    console.log('Tous les headers:', JSON.stringify(allHeaders, null, 2));

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/');

    // Vérification de l'origine
    const isAllowedOrigin = origin ? allowedOrigins.includes(origin) : true;
    console.log('Origine autorisée:', isAllowedOrigin, 'Origine:', origin);

    // Si on est sur la page de login, on redirige vers le serveur SSO via le proxy
    if (req.nextUrl.pathname === '/login') {
        const referer = req.headers.get('referer');
        // Vérifie si on vient déjà du SSO ou si on a un token valide
        if (!referer?.includes('sso.intranet.fhm.local') && !token) {
            console.log('Redirection vers le serveur SSO via proxy');
            // Utilisation du chemin proxy /sso/ au lieu de l'URL directe
            const ssoUrl = new URL('/sso/', req.url);
            const redirectUrl = new URL('/login', 'http://spotly.fhm.local');
            ssoUrl.searchParams.set('redirect', redirectUrl.toString());
            return NextResponse.redirect(ssoUrl);
        }
        console.log('Pas de redirection nécessaire - déjà authentifié ou venant du SSO');
    }

    // Gestion de l'authentification Kerberos
    const authHeader = req.headers.get('authorization');
    console.log('Auth header complet:', authHeader);
    
    if (authHeader?.startsWith('Negotiate ')) {
        console.log('Kerberos ticket detected in header');
        const ticket = authHeader.substring('Negotiate '.length);
        console.log('Ticket length:', ticket.length);
        console.log('Redirecting to Kerberos callback...');
        return NextResponse.redirect(new URL('/api/auth/callback/kerberos', req.url));
    }

    // Gestion spéciale pour les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        console.log('Traitement requête OPTIONS');
        const response = new Response(null, {status: 204});

        // Ajout des en-têtes CORS
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        response.headers.set('Access-Control-Max-Age', '86400');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Expose-Headers', 'Location, WWW-Authenticate');

        console.log('En-têtes CORS OPTIONS:', Object.fromEntries(response.headers.entries()));
        return response;
    }

    if (!token || (token.role !== "ADMIN" && token.role !== "SUPERADMIN")) {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        if (isAdminRoute) {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    const response = NextResponse.next();

    // Ajout des en-têtes CORS pour toutes les réponses
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Expose-Headers', 'Location, WWW-Authenticate');

    console.log('En-têtes CORS réponse:', Object.fromEntries(response.headers.entries()));
    return response;
}

export const config = {
    matcher: [
        '/api/:path*',
        '/admin/:path*',
        '/login'
    ],
};