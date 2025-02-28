import type { Linter } from 'eslint';

import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export const prettierConfig: Linter.Config = {
  ...eslintPluginPrettier,
  name: '@codefast/style-guide/configs/utils/prettier',
  rules: {
    ...eslintPluginPrettier.rules,
    'prettier/prettier': 'warn',
  },
};
