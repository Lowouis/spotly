import {NextResponse} from 'next/server';
import {getToken} from 'next-auth/jwt';
import nextConfig from './next.config.mjs';

const basePath = nextConfig.basePath || '';
const trustedOrigin = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).origin
    : 'http://localhost:3000';

// Helper function to add CORS headers to any response
function addCorsHeaders(response) {
    response.headers.set('Access-Control-Allow-Origin', trustedOrigin);
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
        return addCorsHeaders(optionsResponse);
    }

    const pathname = req.nextUrl.pathname;
    const pathWithoutBasePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname;
    
    // Create the base response that will be used for pass-through requests
    const response = NextResponse.next();
    addCorsHeaders(response);

    // Public routes that do not require authentication
    const publicRoutes = [
        '/login',
        '/register',
        '/api',
        '/_next',
        '/favicon.ico',
        '/spotly_logo.png',
        '/banner.png'
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

    if (!isAuth) {
        loginUrl.searchParams.set('callbackUrl', req.url);
        const redirectResponse = NextResponse.redirect(loginUrl);
        return addCorsHeaders(redirectResponse);
    }

    // At this point, the user is authenticated. Now check roles.
    if (pathWithoutBasePath.startsWith('/admin')) {
        if (token.role !== "ADMIN" && token.role !== "SUPERADMIN") {
            loginUrl.searchParams.set('callbackUrl', req.url);
            const redirectResponse = NextResponse.redirect(loginUrl);
            return addCorsHeaders(redirectResponse);
        }
    }

    // If all checks pass, allow the request.
    return response;
}

export const config = {
    matcher: [
        // Exclude all static resources
        '/((?!_next/static|_next/image|favicon.ico|public/|spotly_logo.png|banner.png).*)',
    ],
};
