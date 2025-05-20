import {getToken} from "next-auth/jwt";
import {NextResponse} from "next/server";

export async function middleware(req) {
    console.log('🔍 Middleware - Requête reçue:', {
        url: req.url,
        method: req.method,
        pathname: req.nextUrl.pathname,
        origin: req.headers.get('origin'),
        headers: Object.fromEntries(req.headers.entries())
    });

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('🔑 Token:', token ? 'Présent' : 'Absent');

    // Gestion spéciale pour les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        console.log('🛑 Requête OPTIONS détectée');
        const response = new Response(null, {status: 204});

        // Ajout des en-têtes CORS
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400'); // 24 heures

        return response;
    }

    if (!token || (token.role !== "ADMIN" && token.role !== "SUPERADMIN")) {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        if (isAdminRoute) {
            console.log('🚫 Accès admin refusé - Redirection vers /');
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    const response = NextResponse.next();

    // Ajout des en-têtes CORS pour toutes les réponses
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Log des en-têtes de réponse
    console.log('📤 En-têtes de réponse:', {
        headers: Object.fromEntries(response.headers.entries())
    });

    return response;
}

export const config = {
    matcher: [
        "/api/:path*",
        "/admin/:path*",
    ],
};