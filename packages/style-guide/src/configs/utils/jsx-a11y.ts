// @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import { type Linter } from 'eslint';

import { jsxA11yRules } from '@/rules/jsx-a11y';

/** @type {import('eslint').Linter.Config} */
export const jsxA11yConfig: Linter.Config = {
  ...jsxA11yPlugin.flatConfigs.recommended,
  rules: {
    ...jsxA11yPlugin.flatConfigs.recommended.rules,
    ...jsxA11yRules.rules,
  },
};
