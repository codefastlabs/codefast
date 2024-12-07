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
      typescript: true,
    },
  },
};
