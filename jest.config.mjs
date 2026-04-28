import nextJest from 'next/jest.js';

const createJestConfig = nextJest({dir: './'});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
    testPathIgnorePatterns: ['/node_modules/', '/pages/api/', '/e2e/'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    collectCoverageFrom: [
        'app/**/*.{js,jsx}',
        'components/**/*.{js,jsx}',
        'features/**/*.{js,jsx}',
        'hooks/**/*.{js,jsx}',
        'services/**/*.{js,jsx}',
        '!**/*.test.{js,jsx}',
        '!**/node_modules/**',
    ],
};

export default createJestConfig(customJestConfig);
