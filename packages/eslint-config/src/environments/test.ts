import globals from "globals";

import type { Linter } from "eslint";

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

        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
        jest: "readonly",

        vi: "readonly",

        suite: "readonly",

        spyOn: "readonly",
        jasmine: "readonly",
      },
    },
  },
];
