import nextEnv from '@next/env';
import {validateEnv} from '../config/env.mjs';

const {loadEnvConfig} = nextEnv;

loadEnvConfig(process.cwd());

try {
    const strict = process.env.NODE_ENV === 'production' || process.env.CI === 'true';
    const result = validateEnv({strict});

    if (!strict && result.missing.length > 0) {
        console.warn(`Environment warning: missing ${result.missing.join(', ')}`);
    }
} catch (error) {
    console.error(error.message);
    process.exit(1);
}
