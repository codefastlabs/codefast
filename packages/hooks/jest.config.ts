import { type Config } from 'jest';

const config: Config = {
  /**
   * Indicates which provider should be used to instrument code for coverage
   */
  coverageProvider: 'v8',

  /**
   * Configuration for module name mapping used in module resolution.
   */
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

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
  testMatch: ['**/?(*.)+(test).[jt]s?(x)'],

  /**
   * Configuration for transforming source files before testing
   * Uses \@swc/jest to quickly transform JavaScript/TypeScript files
   */
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': '@swc/jest',
  },

  /**
   * Specifies which files should be ignored during transformation
   * Prevents Jest from transforming files in the node_modules directory
   */
  transformIgnorePatterns: ['/node_modules/'],

  /**
   * Defines patterns for files that should be ignored during watch mode
   * Prevents unnecessary recompilation of dist directory contents
   */
  watchPathIgnorePatterns: ['/dist/'],
};

export default config;
