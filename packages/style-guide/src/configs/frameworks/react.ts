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
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactRules.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  reactPlugin.configs.flat['jsx-runtime'],
  importPlugin.flatConfigs.react,
  jsxA11yConfig,
  reactHooksConfig,
];
