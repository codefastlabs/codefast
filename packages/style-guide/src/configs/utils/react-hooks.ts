import type { Linter } from 'eslint';

import eslintPluginReactHooks from 'eslint-plugin-react-hooks';

export const reactHooksConfig: Linter.Config = {
  ...eslintPluginReactHooks.configs['recommended-latest'],
  name: '@codefast/style-guide/configs/utils/react-hooks',
  rules: {
    ...eslintPluginReactHooks.configs['recommended-latest'].rules,
  },
};
