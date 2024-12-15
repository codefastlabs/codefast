import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import reactHooksPlugin from 'eslint-plugin-react-hooks';

/**
 * Because `eslint-plugin-react-hooks` hasn't been upgraded to eslint 9, we need to declare plugins.
 * Suggested syntax:
 *
 * @example
 * ```ts
 * {
 *   ...reactHooksPlugin.configs.recommended,
 *   rules: {
 *     ...reactHooksPlugin.configs.recommended.rules,
 *   },
 * }
 * ```
 */
export const reactHooksConfig: Linter.Config = {
  plugins: {
    'react-hooks': reactHooksPlugin,
  },
  rules: {
    ...reactHooksPlugin.configs.recommended.rules,
  },
};
