import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import importPlugin from 'eslint-plugin-import';
import { configs as tsConfig } from 'typescript-eslint';

import { tsdocConfig } from '@/configs/utils/tsdoc';
import { typescriptRules } from '@/rules/typescript';
import { typescriptExtensionRules } from '@/rules/typescript/extension';
import { typescriptImportRules } from '@/rules/typescript/import';

export const typescriptConfig: Linter.Config[] = [
  ...tsConfig.strictTypeChecked,
  ...tsConfig.stylisticTypeChecked,
  importPlugin.flatConfigs.typescript,
  tsdocConfig,
  {
    name: '@codefast/style-guide/configs/core/typescript',
    rules: {
      ...typescriptRules.rules,
      ...typescriptExtensionRules.rules,
      ...typescriptImportRules.rules,
    },
  },
];
