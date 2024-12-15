import type { Linter } from 'eslint';

// @ts-expect-error: Library doesn't yet support TypeScript, awaiting update or @types support
import reactHooksPlugin from 'eslint-plugin-react-hooks';

/**
 * Vì react-hooks chưa được nâng cấp lên eslint 9, chúng ta cần khai báo plugins.
 * Cú pháp đề xuất:
 *
 * @example
 * ```js
 * {
 *   ...reactHooksPlugin.configs.recommended,
 *   rules: {
 *     ...reactHooksPlugin.configs.recommended.rules,
 *   },
 * }
 * ```
 *
 * @type {import('eslint').Linter.Config}
 */
export const reactHooksConfig: Linter.Config = {
  plugins: {
    'react-hooks': reactHooksPlugin,
  },
  rules: {
    ...reactHooksPlugin.configs.recommended.rules,
  },
};
