import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import requirePackage from '../../lib/require-package';
import { TYPESCRIPT_FILES } from '../../lib/constants';
import tsdoc from '../utils/tsdoc';
import typescriptRules from '../../rules/typescript';
import typescriptExtensionRules from '../../rules/typescript/extension';
import typescriptImportRules from '../../rules/typescript/import';

// Ensure the package 'typescript' is required before use
requirePackage('typescript', 'typescript');

/** @type {import('eslint').Linter.Config[] | import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
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
