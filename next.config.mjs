/** @type {import('next').NextConfig} */
import pkg from "./lib/cors-config.js";

const {allowedOrigins} = pkg;


const nextConfig = {
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    // Nous utilisons une fonction pour générer dynamiquement les en-têtes CORS
                    // car Next.js ne peut pas utiliser directement les valeurs dynamiques
                    {
                        key: "Access-Control-Allow-Origin",
                        value: allowedOrigins.join(',')
                    },
                    {key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"},
                    {key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With"},
                    {key: "Access-Control-Allow-Credentials", value: "true"},
                ]
            }
        ]
    },
    basePath: '/spotly',
}
export default nextConfig;
