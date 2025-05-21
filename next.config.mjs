/** @type {import('next').NextConfig} */

const allowedOrigins = [
    'http://intranet:3000',
    'http://intranet.fhm.local:3000',
    'http://localhost:3000',
    'http://spotly.fhm.local',
    'http://spotly.fhm.local:3000',
    'http://sso.intranet.fhm.local/spotly',
    "http://127.0.0.1:3000",
    "http://spotly"
];

const nextConfig = {
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "*"
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Content-Type, Authorization, X-Requested-With"
                    },
                    {
                        key: "Access-Control-Expose-Headers",
                        value: "Location"
                    }
                ]
            }
        ]
    },
    async redirects() {
        return [
            {
                source: '/api/:path*',
                has: [
                    {
                        type: 'query',
                        key: 'userId',
                    },
                ],
                permanent: false,
                destination: '/api/:path*',
            },
            {
                source: '/api/:path*',
                has: [
                    {
                        type: 'query',
                        key: 'categoryId',
                    },
                    {
                        type: 'query',
                        key: 'domainId',
                    },
                ],
                permanent: false,
                destination: '/api/:path*',
            },
        ]
    },
    //basePath: '/spotly',
}

export default nextConfig;
