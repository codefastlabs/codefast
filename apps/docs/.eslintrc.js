/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@codefast/eslint-config/next.js", "plugin:storybook/recommended"],
  ignorePatterns: ["storybook-static"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  root: true,
};
