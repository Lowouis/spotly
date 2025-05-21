/** @type {import('next').NextConfig} */

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
            {
                source: '/api/entry',
                destination: '/api/entry',
                permanent: false
            },
            {
                source: '/api/entry/:path*',
                destination: '/api/entry/:path*',
                permanent: false
            }
        ]
    },
    //basePath: '/spotly',
}

export default nextConfig;
