/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['@codefast/eslint-config/next', 'plugin:storybook/recommended', 'eslint-config-turbo'],
  ignorePatterns: ['storybook-static'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
  },
  root: true,
};
