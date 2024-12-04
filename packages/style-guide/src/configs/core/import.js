import importPlugin from 'eslint-plugin-import';
import importRules from '../../rules/import';

/** @type {import('eslint').Linter.Config} */
export default {
  ...importPlugin.flatConfigs.recommended,
  rules: {
    ...importPlugin.flatConfigs.recommended.rules,
    ...importRules.rules,
  },
};
