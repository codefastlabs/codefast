import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

import { jsxA11yRules } from '@/rules/jsx-a11y';

export const jsxA11yConfig: Linter.Config = {
  ...jsxA11yPlugin.flatConfigs.recommended,
  rules: {
    ...jsxA11yPlugin.flatConfigs.recommended.rules,
    ...jsxA11yRules.rules,
  },
};
