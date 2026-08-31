const config = {
  "pre-commit": "pnpm exec lint-staged",
  "commit-msg": "pnpm exec commitlint --edit $1",
  // The real gate is the main-protection ruleset (PR + Verify check, no bypass). This guard only
  // rejects an accidental push to main early, then runs fast local unit tests.
  "pre-push":
    'while read -r _local _lsha ref _rsha; do case "$ref" in refs/heads/main) echo "[BLOCKED] Direct push to main is not allowed — open a PR."; exit 1;; esac; done; pnpm exec turbo run test:unit --affected --output-logs=errors-only',
};

export default config;
