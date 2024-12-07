import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

import { tsdocConfig } from '../utils/tsdoc.js';
import { typescriptRules } from '../../rules/typescript/index.js';
import { typescriptExtensionRules } from '../../rules/typescript/extension.js';
import { typescriptImportRules } from '../../rules/typescript/import.js';

/** @type {import('eslint').Linter.Config[] | import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export const config = [
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  importPlugin.flatConfigs.typescript,
  tsdocConfig,
  {
    rules: {
      ...typescriptRules.rules,
      ...typescriptExtensionRules.rules,
      ...typescriptImportRules.rules,
    },
  },
  prettier,
];
