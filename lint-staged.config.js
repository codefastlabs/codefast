export default {
  "*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}": ["pnpm exec oxlint --fix --deny-warnings", "pnpm exec oxfmt"],
  "*.{md,json,jsonc,css,yml,yaml}": "pnpm exec oxfmt",
};
