import { resolve } from 'node:path';

import globals from 'globals';
import jsConfig from '@eslint/js';
import tsConfig from 'typescript-eslint';
// @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
import importPlugin from 'eslint-plugin-import';
import unicornPlugin from 'eslint-plugin-unicorn';
// @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
import onlyWarn from 'eslint-plugin-only-warn';

export default [
  jsConfig.configs.recommended,
  importPlugin.flatConfigs.recommended,
  ...tsConfig.configs.strictTypeChecked,
  ...tsConfig.configs.stylisticTypeChecked,
  unicornPlugin.configs['flat/recommended'],
  {
    plugins: {
      'only-warn': onlyWarn,
    },
  },
  {
    settings: {
      'import/resolver': {
        typescript: true,
      },
    },
  },
  {
    ignores: ['dist'],
  },
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          disallowTypeAnnotations: true,
          fixStyle: 'inline-type-imports',
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin', // Node.js built-in modules
            'external', // Packages
            'internal', // Aliased modules
            'parent', // Relative parent
            'sibling', // Relative sibling
            'index', // Relative index
            'object', // Object imports
            'type', // Type imports
          ],
          'newlines-between': 'always',
        },
      ],
      'sort-keys': 'error',
      'unicorn/import-style': 'off',
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        project: resolve(process.cwd(), 'tsconfig.json'),
        projectService: true,
      },
    },
  },
  {
    files: ['*.config.ts'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
];
