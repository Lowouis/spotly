/** @type {import('next').NextConfig} */

const nextConfig = {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    images: {
        domains: [
            process.env.NEXT_PUBLIC_API_DOMAIN || 'localhost',
            'localhost'
        ].filter(Boolean),
    },
    // Optimisations de performance
    experimental: {
        optimizeCss: true,
        optimizePackageImports: ['@heroui/react', '@heroicons/react'],
    },
    // Compression et optimisation
    compress: true,
    poweredByHeader: false,
    // Optimisations pour mobile
    webpack: (config, {dev, isServer}) => {
        if (!dev && !isServer) {
            // Optimiser les bundles pour mobile
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                    },
                    heroui: {
                        test: /[\\/]node_modules[\\/]@heroui[\\/]/,
                        name: 'heroui',
                        chunks: 'all',
                        priority: 10,
                    },
                },
            };
        }
        return config;
    },
}

export default nextConfig;
