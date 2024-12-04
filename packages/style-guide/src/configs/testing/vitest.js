import vitest from '@vitest/eslint-plugin';
import vitestRules from '../../rules/vitest';

/** @type {import('eslint').Linter.Config} */
export default {
  plugins: {
    vitest,
  },
  rules: {
    ...vitest.configs.recommended.rules,
    ...vitestRules.rules,
  },
};
