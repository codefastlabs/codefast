import type { Linter } from "eslint";

import json from "@eslint/json";

export const jsonRules: Linter.Config[] = [
  {
    files: ["**/*.json"],
    ignores: ["package-lock.json"],
    language: "json/json",
    name: "@codefast/eslint-config/language/json",
    plugins: { json },
    rules: {
      ...json.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.jsonc"],
    language: "json/jsonc",
    name: "@codefast/eslint-config/language/jsonc",
    plugins: { json },
    rules: {
      ...json.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.json5"],
    language: "json/json5",
    name: "@codefast/eslint-config/language/json5",
    plugins: { json },
    rules: {
      ...json.configs.recommended.rules,
    },
  },
];
