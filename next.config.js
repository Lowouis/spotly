const allowedOrigins = [
    'http://intranet:3000',
    'http://intranet.fhm.local:3000',
    'http://localhost:3000'
];

/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    {
                        key: "Access-Control-Allow-Origin",
                        value: allowedOrigins.join(',')
                    },
                    {key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS"},
                    {key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization"},
                ]
            }
        ]
    }
}

module.exports = nextConfig