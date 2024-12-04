import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

import { checkPeerDependency as requirePackage } from '../../lib/require-package.js';
import { TYPESCRIPT_FILES } from '../../lib/constants.js';
import { config as tsdoc } from '../utils/tsdoc.js';
import { config as typescriptRules } from '../../rules/typescript/index.js';
import { config as typescriptExtensionRules } from '../../rules/typescript/extension.js';
import { config as typescriptImportRules } from '../../rules/typescript/import.js';

// Ensure the package 'typescript' is required before use
requirePackage('typescript', 'typescript');

/** @type {import('eslint').Linter.Config[] | import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export const config = [
  // Base TypeScript Configs
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Import Plugin Configuration for TypeScript
  importPlugin.flatConfigs.typescript,

  // Prettier Configuration for Code Style Enforcement
  prettier,

  // TSDoc Plugin Configuration
  tsdoc,

  // Custom TypeScript-Specific Configurations
  {
    files: TYPESCRIPT_FILES,
    rules: {
      ...typescriptRules.rules,
      ...typescriptExtensionRules.rules,
      ...typescriptImportRules.rules,
    },
    settings: {
      'import/resolver': {
        // Resolve imports using TypeScript files
        typescript: true,
      },
    },
  },
];
