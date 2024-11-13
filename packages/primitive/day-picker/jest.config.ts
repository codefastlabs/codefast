import { type Config } from 'jest';

const config: Config = {
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Jest preset for TypeScript support
  preset: 'ts-jest',
  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',
  // The glob patterns Jest uses to detect test files
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test).[jt]s?(x)'],
  testPathIgnorePatterns: [
    // Don't look for tests in node_modules
    '/node_modules/',
    // Don't look for tests in dist
    '/dist/',
  ],
};

export default config;
