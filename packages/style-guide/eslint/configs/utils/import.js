import importPlugin from 'eslint-plugin-import';

import { config as importRules } from '../../rules/import.js';

/** @type {import('eslint').Linter.Config} */
export const config = {
  ...importPlugin.flatConfigs.recommended,
  rules: {
    ...importPlugin.flatConfigs.recommended.rules,
    ...importRules.rules,
  },
};
