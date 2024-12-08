import testingLibraryPlugin from 'eslint-plugin-testing-library';
import { type Linter } from 'eslint';

export const testingLibraryConfig: Linter.Config = testingLibraryPlugin.configs['flat/react'];
