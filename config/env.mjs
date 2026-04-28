const REQUIRED_SERVER_ENV = ['DATABASE_URL', 'AUTH_SECRET', 'LDAP_ENCRYPTION_KEY', 'NEXTAUTH_URL'];
const REQUIRED_PUBLIC_ENV = ['NEXT_PUBLIC_API_ENDPOINT'];

function missingRequiredEnv(keys) {
    return keys.filter((key) => !process.env[key] || process.env[key]?.startsWith('CHANGE_ME'));
}

export function validateEnv({strict = process.env.NODE_ENV === 'production'} = {}) {
    const missing = missingRequiredEnv([...REQUIRED_SERVER_ENV, ...REQUIRED_PUBLIC_ENV]);

    if (strict && missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return {
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
        apiEndpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || '',
        apiDomain: process.env.NEXT_PUBLIC_API_DOMAIN || 'localhost',
        missing,
    };
}

export const env = validateEnv({strict: false});
