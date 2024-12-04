import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import commentsRules from '../../rules/comments.js';

/** @type {import('eslint').Linter.Config} */
const config = {
  ...comments.recommended,
  rules: {
    ...comments.recommended.rules,
    ...commentsRules.rules,
  },
};

export { config as default };
