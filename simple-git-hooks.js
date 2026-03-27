const config = {
  "pre-commit": "pnpm exec lint-staged",
  "commit-msg": "pnpm exec commitlint --edit $1",
};

export default config;
