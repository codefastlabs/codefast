import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';

import { jsxA11yConfig } from '@/configs/utils/jsx-a11y';
import { reactHooksConfig } from '@/configs/utils/react-hooks';
import { reactRules } from '@/rules/react';

export const reactConfig: Linter.Config[] = [
  {
    ...reactPlugin.configs.flat.recommended,
    name: '@codefast/style-guide/configs/frameworks/react',
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ...reactPlugin.configs.flat['jsx-runtime'],
    name: '@codefast/style-guide/configs/frameworks/react/jsx-runtime',
  },
  {
    ...importPlugin.flatConfigs.react,
    name: '@codefast/style-guide/configs/frameworks/react/import',
  },
  {
    ...jsxA11yConfig,
    name: '@codefast/style-guide/configs/frameworks/react/jsx-a11y',
  },
  {
    ...reactHooksConfig,
    name: '@codefast/style-guide/configs/frameworks/react/react-hooks',
  },
  {
    name: '@codefast/style-guide/configs/frameworks/react/rules',
    rules: {
      ...reactRules.rules,
    },
  },
];
