import tsConfig from 'typescript-eslint';
// @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
import importPlugin from 'eslint-plugin-import';
// @ts-expect-error: Library does not yet support TypeScript, awaiting update or @types support
import prettierConfig from 'eslint-config-prettier';
import { type Linter } from 'eslint';

import { tsdocConfig } from '@/configs/utils/tsdoc';
import { typescriptRules } from '@/rules/typescript';
import { typescriptExtensionRules } from '@/rules/typescript/extension';
import { typescriptImportRules } from '@/rules/typescript/import';

export const typescriptConfig: Linter.Config[] = [
  ...tsConfig.configs.strictTypeChecked,
  ...tsConfig.configs.stylisticTypeChecked,
  importPlugin.flatConfigs.typescript,
  tsdocConfig,
  typescriptRules,
  typescriptExtensionRules,
  typescriptImportRules,
  prettierConfig,
];