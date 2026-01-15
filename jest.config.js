module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'controllers/**/*.js',
        'models/**/*.js',
        'routes/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**',
    ],
    testMatch: [
        '**/tests/**/*.test.js',
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 10000,
    verbose: true,
};
