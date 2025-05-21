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
                        key: "Access-Control-Allow-Credentials",
                        value: "true"
                    },
                    {
                        key: "Access-Control-Expose-Headers",
                        value: "Location"
                    }
                ]
            }
        ]
    },
    //basePath: '/spotly',
}

export default nextConfig;
