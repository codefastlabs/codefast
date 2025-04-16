import type { Linter } from "eslint";

/**
 * These are enabled by `jsx-a11y/recommended`, but we've made the decision to
 * disable them.
 */
const disabledRules: Partial<Linter.RulesRecord> = {
  // The 'no-onchange' rule has been deprecated in favor of allowing onChange events
  // but remains in the jsx-a11y plugin for backward compatibility.
  "jsx-a11y/no-onchange": "off",

  // We've disabled the requirement for headings to contain content
  // as we sometimes use styled headings with aria-label or have content injected.
  "jsx-a11y/heading-has-content": "off",
};

export const jsxA11yRules: Linter.Config = {
  name: "@codefast/style-guide/rules/jsx-a11y",
  rules: {
    ...disabledRules,
  },
};
