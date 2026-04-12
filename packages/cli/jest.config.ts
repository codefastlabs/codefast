import type { Config } from "jest";

const config: Config = {
  coverageProvider: "v8",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^#(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  transform: {
    "^.+\\.ts$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
          },
        },
      },
    ],
  },
  passWithNoTests: true,
  verbose: true,
  watchPathIgnorePatterns: ["<rootDir>/dist/"],
};

export default config;
