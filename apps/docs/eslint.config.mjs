import { config } from '@codefast/eslint-config/next';

/** @type {import('eslint').Linter.Config[]} */
const nextConfig = [
  ...config,
  {
    rules: {
      'import/no-cycle': 'off',
    },
  },
];

export default nextConfig;
