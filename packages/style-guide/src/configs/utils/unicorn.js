import unicorn from 'eslint-plugin-unicorn';
import unicornRules from '../../rules/unicorn.js';

/** @type {import('eslint').Linter.Config} */
const config = {
  plugins: {
    unicorn,
  },
  rules: {
    ...unicornRules.rules,
  },
};

export { config as default };
