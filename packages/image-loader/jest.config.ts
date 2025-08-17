import type { Config } from "jest";

const config: Config = {
  /**
   * Indicates which provider should be used to instrument code for coverage
   */
  coverageProvider: "v8",

  /**
   * A list of file extensions to treat as ESM
   */
  extensionsToTreatAsEsm: [".ts", ".tsx"],

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
  testMatch: ["**/__tests__/**/*.?([mc])[jt]s?(x)", "**/?(*.)+(spec|test).?([mc])[jt]s?(x)"],

  /**
   * The glob patterns Jest uses to ignore test files
   */
  testPathIgnorePatterns: ["<rootDir>/dist/"],

  /**
   * Configuration for transforming source files before testing
   * Uses `@swc/jest` to quickly transform JavaScript/TypeScript files
   */
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },

  /**
   * Specifies which files should be ignored during transformation
   * Allows transformation of ES modules and their dependencies while ignoring others
   * Handles pnpm's nested node_modules structure
   */
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm/)?(query-string|decode-uri-component|filter-obj|split-on-first))",
  ],

  /**
   * Allow Jest to pass when no test files are found
   */
  passWithNoTests: true,

  /**
   * Displays detailed information about each test
   */
  verbose: true,

  /**
   * Defines patterns for files that should be ignored during watch mode
   * Prevents unnecessary recompilation of dist directory contents
   */
  watchPathIgnorePatterns: ["<rootDir>/dist/"],
};

export default config;
