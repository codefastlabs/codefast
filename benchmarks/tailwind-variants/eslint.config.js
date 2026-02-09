import js from '@eslint/js';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    name: 'benchmarks/tailwind-variants/recommended',
    extends: [js.configs.recommended],
  },
  {
    name: 'benchmarks/tailwind-variants/custom-rules',
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      // Disable rules that don't make sense for benchmarks
      'no-console': 'off',
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
]);
