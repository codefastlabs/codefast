import unicorn from 'eslint-plugin-unicorn';
import unicornRules from '../../rules/unicorn';

/** @type {import('eslint').Linter.Config} */
export default {
  plugins: {
    unicorn,
  },
  rules: {
    ...unicornRules.rules,
  },
};
