import type { Linter } from "eslint";
import globals from "globals";

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

        afterAll: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        describe: "readonly",
        expect: "readonly",
        it: "readonly",
        jasmine: "readonly",
        jest: "readonly",
        spyOn: "readonly",
        suite: "readonly",
        test: "readonly",
        vi: "readonly",
      },
    },
  },
];
