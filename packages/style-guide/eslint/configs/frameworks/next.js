import next from '@next/eslint-plugin-next';

/** @type {import('eslint').Linter.Config[]} */
export const config = [
  {
    plugins: {
      '@next/next': next,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
];
