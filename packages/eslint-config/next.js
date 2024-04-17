const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    require.resolve("@vercel/style-guide/eslint/browser"),
    require.resolve("@vercel/style-guide/eslint/typescript"),
    require.resolve("@vercel/style-guide/eslint/react"),
    require.resolve("@vercel/style-guide/eslint/next"),
    "eslint-config-turbo",
  ],
  globals: {
    React: true,
    JSX: true,
  },
  ignorePatterns: ["node_modules/", ".next/", ".eslintrc.js", "*.config.js"],
  parserOptions: {
    project,
  },
  plugins: ["only-warn"],
  rules: {
    curly: ["error", "all"],
    "import/no-default-export": "off",
    "react/no-unknown-property": ["error", { ignore: ["vaul-drawer-wrapper"] }],
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
};
