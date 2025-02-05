import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments/configs';

import { commentsRules } from '@/rules/comments';

export const commentsConfig: Linter.Config = {
  ...eslintCommentsPlugin.recommended,
  name: '@codefast/style-guide/configs/utils/comments',
  rules: {
    ...eslintCommentsPlugin.recommended.rules,
    ...commentsRules.rules,
  },
};
