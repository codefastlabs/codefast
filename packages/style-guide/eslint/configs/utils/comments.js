import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';

import { config as commentsRules } from '../../rules/comments.js';

/** @type {import('eslint').Linter.Config} */
export const config = {
  ...comments.recommended,
  rules: {
    ...comments.recommended.rules,
    ...commentsRules.rules,
  },
};
