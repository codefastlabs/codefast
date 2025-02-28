import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import eslintPluginComments from '@eslint-community/eslint-plugin-eslint-comments/configs';

import { commentsRules } from '@/rules/comments';

export const commentsConfig: Linter.Config = {
  ...eslintPluginComments.recommended,
  name: '@codefast/style-guide/configs/utils/comments',
  rules: {
    ...eslintPluginComments.recommended.rules,
    ...commentsRules.rules,
  },
};
