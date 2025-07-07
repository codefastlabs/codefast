/** @type {import("lint-staged").Configuration} */
const config = {
  // JavaScript and TypeScript files: format with Prettier and fix ESLint issues
  "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],

  // JSON, Markdown, and YAML files: format with Prettier
  "*.{json,md,yml,yaml}": ["prettier --write"],

  // Package.json files: format with Prettier (uses prettier-plugin-packagejson)
  "package.json": ["prettier --write"],

  // CSS and Sass files: format with Prettier
  "*.{css,scss,sass}": ["prettier --write"],
};

export default config;
