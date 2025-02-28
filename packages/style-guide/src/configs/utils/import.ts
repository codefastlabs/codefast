import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import eslintPluginImport from 'eslint-plugin-import';

import { importRules } from '@/rules/import';

export const importConfig: Linter.Config = {
  ...eslintPluginImport.flatConfigs.recommended,
  name: '@codefast/style-guide/configs/utils/import',
  rules: {
    ...eslintPluginImport.flatConfigs.recommended.rules,
    ...importRules.rules,
  },
  settings: {
    'import/resolver': {
      typescript: true,
    },
  },
};
