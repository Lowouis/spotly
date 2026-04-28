import {defineConfig} from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    fullyParallel: false,
    workers: 1,
    use: {
        baseURL: 'http://127.0.0.1:3101',
    },
    webServer: {
        command: 'next dev -p 3101',
        url: 'http://127.0.0.1:3101/login',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
            ENABLE_TEST_AUTH_SERVICES: 'true',
            NEXT_PUBLIC_API_ENDPOINT: 'http://127.0.0.1:3101',
            NEXTAUTH_URL: 'http://127.0.0.1:3101',
        },
    },
});
