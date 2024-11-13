import { type Config } from 'jest';

const config: Config = {
  /**
   * Indicates which provider should be used to instrument code for coverage
   */
  coverageProvider: 'v8',

  /**
   * This Jest configuration file sets up various options and behaviors for running tests
   */
  fakeTimers: {
    enableGlobally: true,
  },

  /**
   * Configuration for module name mapping used in module resolution.
   */
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  /**
   * Jest preset for TypeScript support
   */
  preset: 'ts-jest',

  /**
   * A list of paths to directories that Jest should use to search for files in
   */
  roots: ['./src', './examples'],

  /**
   * A list of paths to modules that run some code to configure or set up the testing framework before each test
   */
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  /**
   * The test environment that will be used for testing
   */
  testEnvironment: 'jsdom',

  /**
   * The glob patterns Jest uses to detect test files
   */
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test).[jt]s?(x)'],

  /**
   * An array of regexp pattern strings that are matched against all test paths before executing the test.
   * If the test path matches any of the patterns, it will be skipped.
   *
   * - '/node_modules/': Ignore tests in the 'node_modules' directory.
   * - '/dist/': Ignore tests in the 'dist' directory.
   */
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

export default config;
