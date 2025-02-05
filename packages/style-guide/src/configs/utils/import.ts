import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import importPlugin from 'eslint-plugin-import';

import { importRules } from '@/rules/import';

export const importConfig: Linter.Config = {
  ...importPlugin.flatConfigs.recommended,
  name: '@codefast/style-guide/configs/utils/import',
  rules: {
    ...importPlugin.flatConfigs.recommended.rules,
    ...importRules.rules,
  },
  settings: {
    'import/resolver': {
      typescript: true,
    },
  },
};
