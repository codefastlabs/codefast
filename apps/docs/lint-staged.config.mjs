/** @type {import("lint-staged").Configuration} */
const config = {
  // JavaScript and TypeScript files: format with Prettier and fix ESLint issues
  "*.{js,mjs,cjs,jsx,ts,tsx}": ["prettier --write", "next lint --max-warnings 0 --fix --file"],

  // JSON, Markdown, and YAML files: format with Prettier
  "*.{json,md,yml,yaml}": ["prettier --write"],

  // Package.json files: format with Prettier (uses prettier-plugin-packagejson)
  "package.json": ["prettier --write"],

  // CSS and Sass files: format with Prettier
  "*.{css,scss,sass}": ["prettier --write"],
};

export default config;
