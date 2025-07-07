import globals from "globals";

import type { Linter } from "eslint";

// Test environment configuration
export const testEnvironment: Linter.Config[] = [
  {
    files: [
      "**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/*.spec.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/test/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/tests/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        // Common test globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
        jest: "readonly",
        // Vitest globals (for compatibility)
        vi: "readonly",
        // Mocha globals (for compatibility)
        suite: "readonly",
        // Jasmine globals (for compatibility)
        spyOn: "readonly",
        jasmine: "readonly",
      },
    },
  },
];
