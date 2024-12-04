import testingLibrary from 'eslint-plugin-testing-library';

/** @type {import('eslint').Linter.Config} */
export const config = {
  ...testingLibrary.configs['flat/react'],
};
