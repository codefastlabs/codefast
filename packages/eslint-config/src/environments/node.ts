import type { Linter } from 'eslint';

import globals from 'globals';

export const nodeEnvironment: Linter.Config[] = [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    name: '@codefast/eslint-config/environment/node',
  },
];
