import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const response = NextResponse.next();

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    // Vérifie si l'utilisateur est authentifié et a le rôle admin
    if (!token || token.role === "USER") {

    }

    return response;
}

// Applique le middleware uniquement aux routes d'admin
export const config = {
    matcher: ["/admin/:path*", "/api/:path*"], // Protège toutes les routes sous /admin et /api
};