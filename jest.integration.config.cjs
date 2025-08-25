module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/integration/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
  testTimeout: 60000, // Longer timeout for integration tests
  globalSetup: '<rootDir>/tests/integration/global-setup.ts',
  globalTeardown: '<rootDir>/tests/integration/global-teardown.ts',
};