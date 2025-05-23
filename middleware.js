import {NextResponse} from 'next/server';
import {getToken} from 'next-auth/jwt';
import nextConfig from './next.config.mjs';

const basePath = nextConfig.basePath || '';

export async function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const origin = req.headers.get('origin') || '';

    // Gérer les requêtes CORS
    if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    // Vérifier l'authentification pour les routes protégées
    const token = await getToken({req});
    const isAuth = !!token;

    // Routes publiques qui ne nécessitent pas d'authentification
    const publicRoutes = [
        '/login',
        '/api/auth',
        '/api/check-sso',
    ];

    // Vérifier si la route actuelle est publique en retirant le basePath
    const pathWithoutBasePath = pathname.replace(basePath, '');
    const isPublicRoute = publicRoutes.some(route => pathWithoutBasePath.startsWith(route));

    // Si la route est publique, permettre l'accès
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Vérifier l'accès aux routes admin
    if (pathWithoutBasePath === '/admin' && (!isAuth || !token.role === "USER")) {
        return NextResponse.redirect(new URL(`${basePath}/login`, req.url));
    }

    // Rediriger vers la page de connexion si non authentifié
    if (!isAuth) {
        return NextResponse.redirect(new URL(`${basePath}/login`, req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};