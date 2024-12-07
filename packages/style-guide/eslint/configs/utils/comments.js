import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments/configs';

import { commentsRules } from '../../rules/comments.js';

/** @type {import('eslint').Linter.Config} */
export const commentsConfig = {
  ...eslintCommentsPlugin.recommended,
  rules: {
    ...eslintCommentsPlugin.recommended.rules,
    ...commentsRules.rules,
  },
};
