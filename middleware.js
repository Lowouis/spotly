import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const response = NextResponse.next();

    // Add CORS headers while keeping existing functionality
    response.headers.set('Access-Control-Allow-Origin', 'http://intranet.fhm.local:3000, http://intranet:3000');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    if (!token || (token.role !== "ADMIN" && token.role !== "SUPERADMIN")) {
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        if (isAdminRoute) {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }
    return response;
}

export const config = {
    matcher: ["/admin/:path*", "/api/:path*"],
};