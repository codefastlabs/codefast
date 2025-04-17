import type { Linter } from "eslint";

/**
 * These are enabled by `jsx-a11y/recommended`, but we've made the decision to
 * disable them.
 */
const disabledRules: Partial<Linter.RulesRecord> = {
  /**
   * Ensures anchor elements have content accessible to screen readers.
   * We've disabled this rule as we sometimes use anchor tags without direct content,
   * but with aria-labels or content injected through other means (like icons).
   */
  "jsx-a11y/anchor-has-content": "off",

  /**
   * Ensures heading elements (h1-h6) have content accessible to screen readers.
   * We've disabled the requirement for headings to contain content
   * as we sometimes use styled headings with aria-label or have content
   * injected.
   */
  "jsx-a11y/heading-has-content": "off",

  /**
   * The 'no-onchange' rule has been deprecated in favor of allowing onChange
   * events but remains in the jsx-a11y plugin for backward compatibility.
   * Modern accessibility standards no longer consider onChange usage problematic.
   */
  "jsx-a11y/no-onchange": "off",
};

export const jsxA11yRules: Linter.Config = {
  name: "@codefast/style-guide/rules/jsx-a11y",
  rules: {
    ...disabledRules,
  },
};
