export default {
  "*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}": [
    "pnpm exec oxlint --fix --deny-warnings",
    "pnpm exec oxfmt --no-error-on-unmatched-pattern",
  ],
  "*.{md,json,jsonc,css,yml,yaml}": "pnpm exec oxfmt --no-error-on-unmatched-pattern",
};
