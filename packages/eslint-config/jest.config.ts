import type { Config } from "jest";

const config: Config = {
  /**
   * Configuration for collecting coverage information
   */
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/*.spec.ts", "!src/**/*.d.ts"],

  /**
   * Indicates which provider should be used to instrument code for coverage
   */
  coverageProvider: "v8",

  /**
   * Extensions to treat as ESM
   */
  extensionsToTreatAsEsm: [".ts"],

  /**
   * File extensions Jest will process
   */
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  /**
   * Configuration for module name mapping used in module resolution.
   */
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  /**
   * Directories that Jest should scan for tests and modules
   */
  roots: ["<rootDir>/src"],

  /**
   * A list of paths to modules that run some code to configure or set up the testing framework before each test
   */
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  /**
   * The test environment that will be used for testing
   */
  testEnvironment: "node",

  /**
   * The glob patterns Jest uses to detect test files
   */
  testMatch: ["**/*.test.[jt]s?(x)", "**/*.spec.[jt]s?(x)"],

  /**
   * Configuration for transforming source files before testing
   * Uses \@swc/jest to quickly transform JavaScript/TypeScript files
   */
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: false,
            decorators: false,
          },
          target: "es2022",
          loose: false,
          externalHelpers: false,
        },
        module: {
          type: "es6",
        },
      },
    ],
  },

  /**
   * Specifies which files should be ignored during transformation
   * Prevents Jest from transforming files in the node_modules directory
   * Except for ESM modules that need to be transformed
   */
  transformIgnorePatterns: [
    "/node_modules/(?!(@eslint/markdown|mdast-util-from-markdown|micromark|decode-named-character-reference|character-entities|unist-util-stringify-position|mdast-util-to-string|mdast-util-find-and-replace|escape-string-regexp|unist-util-is|unist-util-visit-parents|unist-util-visit)/)",
  ],

  verbose: true,

  /**
   * Defines patterns for files that should be ignored during watch mode
   * Prevents unnecessary recompilation of dist directory contents
   */
  watchPathIgnorePatterns: ["<rootDir>/dist/"],
};

export default config;
