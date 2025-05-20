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
        return new Response(null, {status: 204});
    }

    if (!token || (token.role !== "ADMIN" && token.role !== "SUPERADMIN")) {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        if (isAdminRoute) {
            console.log('🚫 Accès admin refusé - Redirection vers /');
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    const response = NextResponse.next();

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