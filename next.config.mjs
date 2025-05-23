/** @type {import('next').NextConfig} */

console.log(process.env.NEXT_PUBLIC_BASE_PATH);

const nextConfig = {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
    images: {
        domains: [
            process.env.NEXT_PUBLIC_API_DOMAIN || 'localhost',
            'localhost'
        ].filter(Boolean),
    }
}

export default nextConfig;
