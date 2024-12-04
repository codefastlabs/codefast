import importPlugin from 'eslint-plugin-import';
import importRules from '../../rules/import.js';

/** @type {import('eslint').Linter.Config} */
const config = {
  ...importPlugin.flatConfigs.recommended,
  rules: {
    ...importPlugin.flatConfigs.recommended.rules,
    ...importRules.rules,
  },
};

export { config as default };
