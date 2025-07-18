/**
 * Modern Prettier configuration following current best practices
 * @see https://prettier.io/docs/configuration
 * @type {import('prettier').Config}
 */
export default {
  // Core formatting options - Modern best practices
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",
  endOfLine: "lf",

  // Modern formatting options
  experimentalTernaries: false,
  singleAttributePerLine: false,

  // Plugin configuration - Order matters for proper formatting
  plugins: ["prettier-plugin-packagejson", "prettier-plugin-tailwindcss"],

  // Override settings for specific file types
  overrides: [
    {
      files: ["*.json", "*.jsonc"],
      options: {
        printWidth: 120,
        trailingComma: "none",
      },
    },
    {
      files: ["*.yml", "*.yaml"],
      options: {
        printWidth: 120,
        singleQuote: false,
      },
    },
  ],
};
