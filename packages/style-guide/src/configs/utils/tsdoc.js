import tsdoc from 'eslint-plugin-tsdoc';
import tsdocRules from '../../rules/tsdoc';

/** @type {import('eslint').Linter.Config} */
export default {
  plugins: {
    tsdoc,
  },
  rules: {
    ...tsdocRules.rules,
  },
};
