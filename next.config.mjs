/** @type {import('next').NextConfig} */
import {env} from './config/env.mjs';



const nextConfig = {
    basePath: env.basePath,
    outputFileTracingRoot: process.cwd(),
    images: {
        remotePatterns: [env.apiDomain, 'localhost'].filter(Boolean).map((hostname) => ({hostname})),
    }
}

export default nextConfig;
