/**
 * Modern Prettier configuration following current best practices
 * @see https://prettier.io/docs/configuration
 * @type {import('prettier').Config}
 */
export default {
  // Core formatting options - Modern best practices
  arrowParens: "always",
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: "lf",
  jsxSingleQuote: false,
  printWidth: 100,
  quoteProps: "as-needed",
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  useTabs: false,

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
