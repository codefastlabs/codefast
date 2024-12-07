import tsConfig from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

import { tsdocConfig } from '../utils/tsdoc.js';
import { typescriptRules } from '../../rules/typescript/index.js';
import { typescriptExtensionRules } from '../../rules/typescript/extension.js';
import { typescriptImportRules } from '../../rules/typescript/import.js';

/** @type {import('eslint').Linter.Config[] | import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export const typescript = [
  ...tsConfig.configs.strictTypeChecked,
  ...tsConfig.configs.stylisticTypeChecked,
  importPlugin.flatConfigs.typescript,
  tsdocConfig,
  typescriptRules,
  typescriptExtensionRules,
  typescriptImportRules,
  prettierConfig,
];
