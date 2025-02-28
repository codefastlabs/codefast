import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import eslintPluginNext from '@next/eslint-plugin-next';
// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import eslintPluginImport from 'eslint-plugin-import';
// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import eslintPluginJsxA11y from 'eslint-plugin-jsx-a11y';
import eslintPluginReact from 'eslint-plugin-react';

export const nextConfig: Linter.Config[] = [
  {
    name: '@codefast/style-guide/configs/frameworks/next',
    plugins: {
      '@next/next': eslintPluginNext,
    },
    rules: {
      ...eslintPluginNext.configs.recommended.rules,
      ...eslintPluginNext.configs['core-web-vitals'].rules,
    },
  },
  {
    ...eslintPluginImport.flatConfigs.recommended,
    name: '@codefast/style-guide/configs/frameworks/next/import',
    rules: {
      'import/no-anonymous-default-export': 'warn',
    },
  },
  {
    ...eslintPluginJsxA11y.flatConfigs.recommended,
    name: '@codefast/style-guide/configs/frameworks/next/jsx-a11y',
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
    ...eslintPluginReact.configs.flat.recommended,
    name: '@codefast/style-guide/configs/frameworks/next/react',
    rules: {
      'react/jsx-no-target-blank': 'off',
    },
  },
];
