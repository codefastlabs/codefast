// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import nextPlugin from '@next/eslint-plugin-next';
// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import importPlugin from 'eslint-plugin-import';
// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import type { Linter } from 'eslint';

export const nextConfig: Linter.Config[] = [
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    ...importPlugin.flatConfigs.recommended,
    rules: {
      'import/no-anonymous-default-export': 'warn',
    },
  },
  {
    ...jsxA11yPlugin.flatConfigs.recommended,
    rules: {
      'jsx-a11y/alt-text': [
        'warn',
        {
          elements: ['img'],
          img: ['Image'],
        },
      ],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
    },
  },
  {
    ...reactPlugin.configs.flat?.recommended,
    rules: {
      'react/jsx-no-target-blank': 'off',
    },
  },
];
