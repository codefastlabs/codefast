import type { Linter } from 'eslint';

import json from '@eslint/json';

/**
 * ESLint configuration for JSON files.
 *
 * Note: Type assertion is required due to a known type incompatibility between
 * `@eslint/json` v1.0.0 and ESLint's `Linter.Config` types. The plugin uses
 * more specific types for its rules that don't match ESLint's generic types.
 *
 * @see https://github.com/eslint/json/issues
 */
export const jsonRules: Linter.Config[] = [
  {
    files: ['**/*.json'],
    ignores: ['package-lock.json'],
    language: 'json/json',
    name: '@codefast/eslint-config/language/json',
    plugins: {
      // @ts-expect-error -- Type incompatibility between @eslint/json and ESLint types
      json,
    },
    rules: {
      ...json.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.jsonc'],
    language: 'json/jsonc',
    name: '@codefast/eslint-config/language/jsonc',
    plugins: {
      // @ts-expect-error -- Type incompatibility between @eslint/json and ESLint types
      json,
    },
    rules: {
      ...json.configs.recommended.rules,
    },
  },
  {
    files: ['**/*.json5'],
    language: 'json/json5',
    name: '@codefast/eslint-config/language/json5',
    plugins: {
      // @ts-expect-error -- Type incompatibility between @eslint/json and ESLint types
      json,
    },
    rules: {
      ...json.configs.recommended.rules,
    },
  },
];
