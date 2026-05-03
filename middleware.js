import {NextResponse} from 'next/server';
import {getToken} from 'next-auth/jwt';
import {publicEnv} from './config/publicEnv';

const basePath = publicEnv.basePath;
const trustedOrigin = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).origin
    : 'http://localhost:3000';

function getAllowedCorsOrigin(req) {
    const requestOrigin = req.headers.get('origin');

    if (!requestOrigin) return trustedOrigin;

    try {
        const originUrl = new URL(requestOrigin);
        const trustedUrl = new URL(trustedOrigin);
        const isLocalDevOrigin = ['localhost', '127.0.0.1'].includes(originUrl.hostname)
            && ['localhost', '127.0.0.1'].includes(trustedUrl.hostname)
            && originUrl.port === trustedUrl.port;

        return requestOrigin === trustedOrigin || isLocalDevOrigin ? requestOrigin : trustedOrigin;
    } catch {
        return trustedOrigin;
    }
}

// Helper function to add CORS headers to any response
function addCorsHeaders(response, req) {
    response.headers.set('Access-Control-Allow-Origin', getAllowedCorsOrigin(req));
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
}

export async function middleware(req) {
    // Handle pre-flight OPTIONS requests first
    if (req.method === 'OPTIONS') {
        const optionsResponse = new NextResponse(null, { status: 204 });
        return addCorsHeaders(optionsResponse, req);
    }

    const pathname = req.nextUrl.pathname;
    const pathWithoutBasePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;
    
    // Create the base response that will be used for pass-through requests
    const response = NextResponse.next();
    addCorsHeaders(response, req);

    // Public routes that do not require authentication
    const publicRoutes = [
        '/login',
        '/setup',
        '/register',
        '/api/auth*',
        '/api/setup*',
        '/api/public/check-sso',
        '/api/public/kerberos-config',
        '/api/public/client-ip',
        '/api/app-settings',
        '/api/entry',
        '/api/entry/code-action',
        '/api/authorized-location/check*',
        '/_next',
        '/favicon.ico',
        '/favicon.svg',
        '/banner_low.png'
    ];
    
    const normalizedPath = pathWithoutBasePath.endsWith('/') && pathWithoutBasePath.length > 1
        ? pathWithoutBasePath.slice(0, -1)
        : pathWithoutBasePath;

    const isPublicRoute = publicRoutes.some(route => {
        if (route.endsWith('*')) {
            return normalizedPath.startsWith(route.slice(0, -1));
        }
        if (route === '/api') {
            return normalizedPath.startsWith(route);
        }
        return normalizedPath === route;
    });

    if (isPublicRoute) {
        return response; // Pass through with CORS headers
    }

    // From this point, all routes are protected.
    const token = await getToken({req});
    const isAuth = !!token;
    const loginUrl = new URL(`${basePath}/login`, req.url);

    const currentUrl = new URL(req.url);
    if (!isAuth) {
        if (pathWithoutBasePath.startsWith('/api')) {
            const unauthorizedResponse = NextResponse.json({message: 'Non autorisé'}, {status: 401});
            return addCorsHeaders(unauthorizedResponse, req);
        }
        if (!currentUrl.searchParams.has('callbackUrl')) {
            loginUrl.searchParams.set('callbackUrl', req.url);
        } else {
            loginUrl.searchParams.set('callbackUrl', currentUrl.searchParams.get('callbackUrl'));
        }
        const redirectResponse = NextResponse.redirect(loginUrl);
        return addCorsHeaders(redirectResponse, req);
    }

    // At this point, the user is authenticated. Now check roles.
    if (pathWithoutBasePath.startsWith('/admin')) {
        if (token.role !== "ADMIN" && token.role !== "SUPERADMIN") {
            loginUrl.searchParams.set('callbackUrl', req.url);
            const redirectResponse = NextResponse.redirect(loginUrl);
            return addCorsHeaders(redirectResponse, req);
        }
    }

    // If all checks pass, allow the request.
    return response;
}

export const config = {
    matcher: [
        // Exclude all static resources
        '/((?!_next/static|_next/image|favicon.ico|favicon.svg|public/|banner_low.png).*)',
    ],
};
