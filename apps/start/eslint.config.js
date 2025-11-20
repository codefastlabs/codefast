import { tanstackConfig } from '@tanstack/eslint-config';
import prettierConfig from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default [
  {
    ignores: [
      '**/.output/**',
      '**/build/**',
      '**/dist/**',
      '**/.cache/**',
      '**/node_modules/**',
      '**/routeTree.gen.ts',
      'eslint.config.js',
    ],
  },
  ...tanstackConfig,
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    ...react.configs.flat['jsx-runtime'],
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    },
  },
  prettierConfig,
];
