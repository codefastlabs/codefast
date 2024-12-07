import testingLibraryPlugin from 'eslint-plugin-testing-library';

/** @type {import('eslint').Linter.Config} */
export const testingLibrary = {
  ...testingLibraryPlugin.configs['flat/react'],
};
