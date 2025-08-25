module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { 
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json',
      diagnostics: false,
    }],
  },
  moduleNameMapper: {
    // Allow ESM .js imports to resolve without extension rewrite
    '^(.{1,2}/.*)\\.js$': '$1',
    // Allow .cjs and .mjs files to resolve as-is
    '^(.+\\.cjs)$': '$1',
    '^(.+\\.mjs)$': '$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts', // Exclude main entry point from coverage
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70, // Lowered temporarily while building up tests
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
};