import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import commentsRules from '../../rules/comments';

/** @type {import('eslint').Linter.Config} */
export default {
  ...comments.recommended,
  rules: {
    ...comments.recommended.rules,
    ...commentsRules.rules,
  },
};
