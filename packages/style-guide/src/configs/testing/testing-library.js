import testingLibrary from 'eslint-plugin-testing-library';

/** @type {import('eslint').Linter.Config} */
export default {
  ...testingLibrary.configs['flat/react'],
};
