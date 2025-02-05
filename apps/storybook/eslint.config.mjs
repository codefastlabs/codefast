import { config } from '@codefast/eslint-config/next';
import storybookPlugin from 'eslint-plugin-storybook';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  ...storybookPlugin.configs['flat/recommended'],
  {
    files: ['**/*.{stories,story}.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: {
      'import/no-cycle': 'off',
      'import/no-default-export': 'off',
    },
  },
];
