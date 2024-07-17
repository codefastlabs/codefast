/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['@codefast/config-eslint/library'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  root: true,
};
