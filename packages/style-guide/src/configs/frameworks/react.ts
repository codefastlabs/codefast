import reactPlugin from 'eslint-plugin-react';
// @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
import importPlugin from 'eslint-plugin-import';
// @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
import prettierConfig from 'eslint-config-prettier';
import { type Linter } from 'eslint';

import { reactHooksConfig } from '@/configs/utils/react-hooks';
import { jsxA11yConfig } from '@/configs/utils/jsx-a11y';
import { reactRules } from '@/rules/react';

export const reactConfig: Linter.Config[] = [
  {
    // @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
    ...reactPlugin.configs.flat.recommended,
    rules: {
      // @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactRules.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
  reactPlugin.configs.flat['jsx-runtime'],
  importPlugin.flatConfigs.react,
  jsxA11yConfig,
  reactHooksConfig,
  prettierConfig,
];
