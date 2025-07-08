import { jest } from "@jest/globals";

/**
 * Jest Setup Configuration for ESLint Config Package
 *
 * Set up necessary extensions and utilities for testing ESLint configurations:
 * - Custom matchers and utilities for ESLint rule testing
 * - Mock problematic ESM modules
 */

jest.mock("@eslint/markdown", () => ({
  configs: {
    recommended: [
      {
        rules: {
          "markdown/no-html": "warn",
        },
      },
    ],
  },
}));

jest.mock("eslint-plugin-import", () => ({
  configs: {
    recommended: {
      rules: {
        "import/no-unresolved": "error",
      },
    },
    typescript: {
      rules: {
        "import/no-unresolved": "off",
      },
    },
  },
}));

jest.mock("eslint-config-prettier", () => ({
  rules: {
    "prettier/prettier": "off",
    "arrow-body-style": "off",
    "prefer-arrow-callback": "off",
  },
}));
