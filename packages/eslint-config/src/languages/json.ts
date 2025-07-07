import json from "@eslint/json";

import type { Linter } from "eslint";

// JSON file configuration
export const jsonRules: Linter.Config[] = [
  {
    files: ["**/*.json"],
    ignores: ["package-lock.json"],
    language: "json/json",
    plugins: { json },
    rules: {
      ...json.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    rules: {
      ...json.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    rules: {
      ...json.configs.recommended.rules,
    },
  },
];
