import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
        }],
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    testMatch: ['**/__tests__/**/*.test.(ts|js)'],
    // ignore compiled output and other build artifacts
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;
