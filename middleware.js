import {getToken} from "next-auth/jwt";
import {NextResponse} from "next/server";

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

export async function middleware(req) {
    console.log('Middleware appelé pour:', req.nextUrl.pathname);
    console.log('Origin:', req.headers.get('origin'));
    console.log('Method:', req.method);

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const origin = req.headers.get('origin');

    // Vérification de l'origine
    const isAllowedOrigin = allowedOrigins.includes(origin);
    console.log('Origine autorisée:', isAllowedOrigin);

    // Gestion spéciale pour les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        console.log('Traitement requête OPTIONS');
        const response = new Response(null, {status: 204});

        // Ajout des en-têtes CORS
        response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : allowedOrigins[0]);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 heures

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
    response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : allowedOrigins[0]);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};