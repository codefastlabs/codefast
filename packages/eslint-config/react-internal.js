const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    require.resolve("@vercel/style-guide/eslint/browser"),
    require.resolve("@vercel/style-guide/eslint/typescript"),
    require.resolve("@vercel/style-guide/eslint/react"),
  ],
  globals: {
    JSX: true,
  },
  ignorePatterns: ["node_modules/", "dist/", ".eslintrc.js", "*.config.js"],
  parserOptions: {
    project,
  },
  plugins: ["only-warn"],
  rules: {
    curly: ["error", "all"],
    "import/no-default-export": "off",
    "react/no-unknown-property": ["error", { ignore: ["cmdk-input-wrapper"] }],
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
};
