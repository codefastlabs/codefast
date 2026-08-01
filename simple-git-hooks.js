const config = {
  "pre-commit": "pnpm exec lint-staged",
  "commit-msg": "pnpm exec commitlint --edit $1",
  // Fast local feedback only — the enforced gate is the Verify check required by the
  // main-protection ruleset, which no longer allows bypass.
  "pre-push": "pnpm exec turbo run test:unit --affected --output-logs=errors-only",
};

export default config;
