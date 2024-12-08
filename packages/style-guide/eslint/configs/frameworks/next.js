import nextPlugin from '@next/eslint-plugin-next';

/** @type {import('eslint').Linter.Config[]} */
export const next = [
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];
