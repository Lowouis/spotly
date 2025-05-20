import {getToken} from "next-auth/jwt";
import {NextResponse} from "next/server";
import Cors from 'cors';
import {allowedOrigins, corsOptions} from './lib/cors-config';

// Initializing the cors middleware
export const cors = Cors(corsOptions);

export async function middleware(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const response = NextResponse.next();

    // Déterminer l'origine de la requête
    const origin = req.headers.get('origin');

    // Ajouter les en-têtes CORS si l'origine est autorisée
    if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
        // Pour les requêtes OPTIONS (preflight), accepter toutes les origines autorisées
        response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
    }

    response.headers.set('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    // Gestion spéciale pour les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: response.headers,
        });
    }

    if (!token || (token.role !== "ADMIN" && token.role !== "SUPERADMIN")) {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        if (isAdminRoute) {
            const redirectUrl = new URL('/', req.url);
            const redirectResponse = NextResponse.redirect(redirectUrl);

            // Copier les en-têtes CORS dans la réponse de redirection
            response.headers.forEach((value, key) => {
                redirectResponse.headers.set(key, value);
            });

            return redirectResponse;
        }
    }

    return response;
}

export const config = {
    matcher: [
        "/api/:path*",
        "/admin/:path*",
    ],
};