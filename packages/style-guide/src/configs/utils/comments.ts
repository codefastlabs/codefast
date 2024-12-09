// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments/configs';
import { type Linter } from 'eslint';

import { commentsRules } from '@/rules/comments';

/** @type {import('eslint').Linter.Config} */
export const commentsConfig: Linter.Config = {
  ...eslintCommentsPlugin.recommended,
  rules: {
    ...eslintCommentsPlugin.recommended.rules,
    ...commentsRules.rules,
  },
};
