/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['@codefast/config-eslint/react'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  root: true,
};
