import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';

export const reactHooksConfig: Linter.Config = {
  name: '@codefast/style-guide/configs/utils/react-hooks',
  plugins: {
    'react-hooks': eslintPluginReactHooks,
  },
  rules: {
    ...eslintPluginReactHooks.configs.recommended.rules,
  },
};
