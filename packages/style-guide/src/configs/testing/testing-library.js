import testingLibrary from 'eslint-plugin-testing-library';

/** @type {import('eslint').Linter.Config} */
const config = {
  ...testingLibrary.configs['flat/react'],
};

export { config as default };
