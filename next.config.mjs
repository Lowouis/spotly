/** @type {import('next').NextConfig} */
import pkg from "./lib/cors-config.js";

const {allowedOrigins} = pkg;

const nextConfig = {
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "*"
                    },
                    {key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"},
                    {key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With"},
                ]
            }
        ]
    },
    //basePath: '/spotly',
}
export default nextConfig;
