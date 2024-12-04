import tsdoc from 'eslint-plugin-tsdoc';
import tsdocRules from '../../rules/tsdoc.js';

/** @type {import('eslint').Linter.Config} */
const config = {
  plugins: {
    tsdoc,
  },
  rules: {
    ...tsdocRules.rules,
  },
};

export { config as default };
