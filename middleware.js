import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Vérifie si l'utilisateur est authentifié et a le rôle admin
    if (!token || token.role === "USER") {
        return NextResponse.redirect(new URL('/', req.url)); // Redirige si non autorisé
    }

    return NextResponse.next();
}

// Applique le middleware uniquement aux routes d'admin
export const config = {
    matcher: "/admin/:path*", // Protège toutes les routes sous /admin
};
