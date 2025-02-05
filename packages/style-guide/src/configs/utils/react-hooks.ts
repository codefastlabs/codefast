import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export const reactHooksConfig: Linter.Config = {
  name: '@codefast/style-guide/configs/utils/react-hooks',
  plugins: {
    'react-hooks': reactHooksPlugin,
  },
  rules: {
    ...reactHooksPlugin.configs.recommended.rules,
  },
};
