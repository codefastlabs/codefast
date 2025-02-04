import type { Linter } from 'eslint';

import testingLibraryPlugin from 'eslint-plugin-testing-library';

export const testingLibraryConfig: Linter.Config = {
  name: 'testing-library',
  ...testingLibraryPlugin.configs['flat/react'],
};
