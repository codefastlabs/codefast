import type { Config } from "jest";

const config: Config = {
  /**
   * Indicates which provider should be used to instrument code for coverage
   */
  coverageProvider: "v8",

  /**
   * Configuration for module name mapping used in module resolution.
   */
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  /**
   * The test environment that will be used for testing
   */
  testEnvironment: "node",

  /**
   * The glob patterns Jest uses to detect test files
   */
  testMatch: ["**/?(*.)+(test|spec|e2e).[jt]s?(x)"],

  /**
   * Configuration for transforming source files before testing
   * Uses \@swc/jest to quickly transform JavaScript/TypeScript files
   */
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2022",
        },
      },
    ],
  },

  /**
   * Specifies which files should be ignored during transformation
   * Prevents Jest from transforming files in the node_modules directory
   */
  transformIgnorePatterns: ["/node_modules/"],

  verbose: true,

  /**
   * Defines patterns for files that should be ignored during watch mode
   * Prevents unnecessary recompilation of dist directory contents
   */
  watchPathIgnorePatterns: ["<rootDir>/dist/"],
};

export default config;
