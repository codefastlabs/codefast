import importPlugin from 'eslint-plugin-import';

import { importRules } from '../../rules/import.js';

/** @type {import('eslint').Linter.Config} */
export const importConfig = {
  ...importPlugin.flatConfigs.recommended,
  rules: {
    ...importPlugin.flatConfigs.recommended.rules,
    ...importRules.rules,
  },
  settings: {
    'import/resolver': {
      // You will also need to install and configure the TypeScript resolver
      // See also https://github.com/import-js/eslint-import-resolver-typescript#configuration
      typescript: true,
    },
  },
};
