/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@codefast/eslint-config/react-internal.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  root: true,
};
