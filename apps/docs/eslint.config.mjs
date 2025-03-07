import { config } from '@codefast/eslint-config/next';

/**
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import('eslint').Linter.Config[]}
 */
const nextConfig = [
  ...config,
  {
    files: ['src/__registry__/*.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
];

export default nextConfig;
