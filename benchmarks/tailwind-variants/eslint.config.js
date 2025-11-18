import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
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
];
