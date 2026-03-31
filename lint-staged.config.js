export default {
  "*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}": [
    "pnpm exec oxfmt",
    "pnpm exec oxlint --fix --deny-warnings",
  ],
  "*.{md,json,jsonc,css}": "pnpm exec oxfmt",
};
