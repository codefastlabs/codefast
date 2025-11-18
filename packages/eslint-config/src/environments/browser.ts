import type { Linter } from 'eslint';

import globals from 'globals';

/**
 * Browser environment configuration for ESLint.
 *
 * This configuration sets up the browser environment for JavaScript and TypeScript files,
 * providing access to browser-specific global variables and ES2021 features.
 *
 * Configures ESLint to recognize browser globals (like `window`, `document`, `console`)
 * and ES2021 globals, enabling proper linting for client-side code without false positives
 * for undefined variables that are actually available in the browser environment.
 *
 * @example
 * ```typescript
 * // These globals will be recognized without errors:
 * window.location.href = '/new-page';
 * document.getElementById('my-element');
 * console.log('Browser environment active');
 * ```
 *
 * @see {@link https://eslint.org/docs/latest/use/configure/language-options#specifying-globals | ESLint Globals Documentation}
 * @see {@link https://github.com/sindresorhus/globals | Globals Package}
 */
export const browserEnvironment: Linter.Config[] = [
  {
    /**
     * File patterns that this configuration applies to.
     * Includes all JavaScript and TypeScript files with various extensions.
     */
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      globals: {
        /**
         * Browser-specific global variables (window, document, navigator, etc.)
         * These are available in web browser environments.
         */
        ...globals.browser,
        /**
         * ES2021 global variables and features.
         * Includes modern JavaScript globals and built-in objects.
         */
        ...globals.es2021,
      },
    },
    name: '@codefast/eslint-config/environment/browser',
  },
];
