// Source: https://github.com/playwright-community/eslint-plugin-playwright/blob/v1.5.1/src/index.ts#L101-L129
import type { Linter } from "eslint";

const disabledRules: Partial<Linter.RulesRecord> = {
  // Allow empty destructuring patterns in test code
  "no-empty-pattern": "off",
};

export const playwrightTestRules: Linter.Config = {
  name: "@codefast/style-guide/rules/playwright-test",
  rules: {
    ...disabledRules,

    /**
     * Ensures test functions contain at least one expect assertion.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/expect-expect.md
     */
    "playwright/expect-expect": "warn",

    /**
     * Prevents deeply nested describe blocks to improve test readability.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/max-nested-describe.md
     */
    "playwright/max-nested-describe": "warn",

    /**
     * Requires await with Playwright async functions/promises to prevent race conditions.
     *
     * 🔧 Fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/missing-playwright-await.md
     */
    "playwright/missing-playwright-await": "error",

    /**
     * Prevents expects within conditional blocks to ensure tests remain deterministic.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-conditional-expect.md
     */
    "playwright/no-conditional-expect": "warn",

    /**
     * Prevents conditionals in test blocks to ensure tests remain deterministic.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-conditional-in-test.md
     */
    "playwright/no-conditional-in-test": "warn",

    /**
     * Discourages use of ElementHandle in favor of Locators for better reliability.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-element-handle.md
     */
    "playwright/no-element-handle": "warn",

    /**
     * Prevents using eval() in tests for security and maintainability.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-eval.md
     */
    "playwright/no-eval": "warn",

    /**
     * Prevents focused tests (.only) from being committed, which would skip other tests.
     *
     * 🔧 Fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-focused-test.md
     */
    "playwright/no-focused-test": "error",

    /**
     * Discourages using force option which may lead to flaky tests.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-force-option.md
     */
    "playwright/no-force-option": "warn",

    /**
     * Prevents nesting test.step() calls to maintain clear test flow.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-nested-step.md
     */
    "playwright/no-nested-step": "warn",

    /**
     * Disallows unreliable 'networkidle' wait event which can cause flaky tests.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-networkidle.md
     */
    "playwright/no-networkidle": "error",

    /**
     * Discourages using page.pause() in committed tests to prevent test hanging.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-page-pause.md
     */
    "playwright/no-page-pause": "warn",

    /**
     * Prevents skipped tests (.skip) from being committed and forgotten.
     *
     * 🔧 Fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-skipped-test.md
     */
    "playwright/no-skipped-test": "warn",

    /**
     * Prevents expect() outside of test/it blocks to ensure proper test structure.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-standalone-expect.md
     */
    "playwright/no-standalone-expect": "error",

    /**
     * Prevents references that may become invalid across test execution.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-unsafe-references.md
     */
    "playwright/no-unsafe-references": "error",

    /**
     * Removes unnecessary await on synchronous methods that return a Promise.
     *
     * 🔧 Fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-useless-await.md
     */
    "playwright/no-useless-await": "warn",

    /**
     * Removes unnecessary not matchers that can be replaced with direct matchers.
     *
     * 🔧 Fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-useless-not.md
     */
    "playwright/no-useless-not": "warn",

    /**
     * Discourages page.waitForSelector() in favor of locator-based waiting.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-wait-for-selector.md
     */
    "playwright/no-wait-for-selector": "warn",

    /**
     * Discourages arbitrary timeouts in favor of action-based waiting.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/no-wait-for-timeout.md
     */
    "playwright/no-wait-for-timeout": "warn",

    /**
     * Encourages web-first assertions like toBeVisible() over DOM-based checks.
     *
     * 🔧 Fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/prefer-web-first-assertions.md
     */
    "playwright/prefer-web-first-assertions": "error",

    /**
     * Ensures describe() callbacks use proper synchronous function format.
     *
     * 🔧 Fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/valid-describe-callback.md
     */
    "playwright/valid-describe-callback": "error",

    /**
     * Ensures expect() is used correctly with proper matchers and arguments.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/valid-expect.md
     */
    "playwright/valid-expect": "error",

    /**
     * Ensures expect() in promises is handled properly to avoid false positives.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/valid-expect-in-promise.md
     */
    "playwright/valid-expect-in-promise": "error",

    /**
     * Ensures test titles follow consistent patterns and don't duplicate.
     *
     * 🚫 Not fixable - https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/valid-title.md
     */
    "playwright/valid-title": "error",

    /**
     * Require lowercase test names.
     *
     * 🔧 Fixable -
     * https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/prefer-lowercase-title.md
     */
    "playwright/prefer-lowercase-title": "warn",

    /**
     * Require using `toHaveLength` over explicitly checking lengths.
     *
     * 🔧 Fixable -
     * https://github.com/playwright-community/eslint-plugin-playwright/blob/main/docs/rules/prefer-lowercase-title.md
     */
    "playwright/prefer-to-have-length": "warn",
  },
};
