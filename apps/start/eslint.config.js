import { tanstackConfig } from '@tanstack/eslint-config';
import prettierConfig from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tsdoc from 'eslint-plugin-tsdoc';
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
    languageOptions: { ...react.configs.flat.recommended.languageOptions, globals: { ...globals.browser } },
    settings: { react: { version: 'detect' } },
  },
  { files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'], ...react.configs.flat['jsx-runtime'] },
  { files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'], ...reactHooks.configs.flat.recommended },
  { files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'], ...jsxA11y.flatConfigs.recommended },
  { files: ['**/*.{ts,tsx}'], plugins: { tsdoc: tsdoc }, rules: { 'tsdoc/syntax': 'warn' } },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      curly: ['error', 'all'],
      'jsx-a11y/anchor-is-valid': 'off',
      'object-shorthand': 'warn',
      'padding-line-between-statements': [
        'error',
        // After directives like 'use client'
        { blankLine: 'always', prev: 'directive', next: '*' },
        { blankLine: 'any', prev: 'directive', next: 'directive' },
        // After imports
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
        // After variable declarations
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        // Around control-flow blocks
        { blankLine: 'always', prev: '*', next: ['if', 'for', 'while', 'switch', 'try'] },
        { blankLine: 'always', prev: ['if', 'for', 'while', 'switch', 'try'], next: '*' },
        // After any block / block-like statement
        { blankLine: 'always', prev: ['block', 'block-like'], next: '*' },
        // Always before return
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
      'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    },
  },
  prettierConfig,
];
