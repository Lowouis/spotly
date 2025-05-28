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
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // Ajouter les en-têtes CORS pour toutes les réponses
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Vérifier l'authentification pour les routes protégées
    const token = await getToken({req});
    const isAuth = !!token;

    console.log('Middleware - Path:', pathname);
    console.log('Middleware - Token:', token);
    console.log('Middleware - BasePath:', basePath);

    // Routes publiques qui ne nécessitent pas d'authentification
    const publicRoutes = [
        '/login',
        '/api/auth',
        '/api/*',
        '/_next',
        '/favicon.ico',
        '/spotly_logo.png',
        '/banner.png'
    ];

    // Vérifier si la route actuelle est publique en retirant le basePath
    const pathWithoutBasePath = pathname.replace(basePath, '');
    console.log('Middleware - Path without basePath:', pathWithoutBasePath);

    const isPublicRoute = publicRoutes.some(route => {
        if (route.endsWith('*')) {
            const baseRoute = route.slice(0, -1);
            return pathWithoutBasePath.startsWith(baseRoute);
        }
        return pathWithoutBasePath === route;
    });

    console.log('Middleware - Is public route:', isPublicRoute);

    // Si la route est publique, permettre l'accès
    if (isPublicRoute) {
        return response;
    }

    // Vérifier l'accès aux routes admin
    if (pathWithoutBasePath.startsWith('/admin')) {
        if (!token || (token.role !== "ADMIN" && token.role !== "SUPERADMIN")) {
            const loginUrl = new URL(`${basePath}/login`, req.url);
            loginUrl.searchParams.set('callbackUrl', req.url);
            console.log('Middleware - Redirecting to login (admin):', loginUrl.toString());
            return NextResponse.redirect(loginUrl);
        }
    }

    if (!isAuth) {
        const loginUrl = new URL(`${basePath}/login`, req.url);
        loginUrl.searchParams.set('callbackUrl', req.url);
        console.log('Middleware - Redirecting to login (auth):', loginUrl.toString());
        return NextResponse.redirect(loginUrl);
    }

    return response;
}

export const config = {
    matcher: [
        // Exclure toutes les ressources statiques
        '/((?!_next/static|_next/image|favicon.ico|public/|spotly_logo.png|banner.png).*)',
    ],
};