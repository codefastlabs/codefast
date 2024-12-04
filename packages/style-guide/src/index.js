import recommended from './configs/recommended.js';
import jestConfig from './configs/testing/jest.js';
import jestTypescript from './configs/testing/jest-typescript.js';
import nextConfig from './configs/frameworks/next.js';
import playwrightTest from './configs/testing/playwright-test.js';
import reactConfig from './configs/frameworks/react.js';
import testingLibrary from './configs/testing/testing-library.js';
import typescriptConfig from './configs/core/typescript.js';
import vitestConfig from './configs/testing/vitest.js';

export default {
  configs: {
    recommended,
    jest: jestConfig,
    'jest-typescript': jestTypescript,
    next: nextConfig,
    'playwright-test': playwrightTest,
    react: reactConfig,
    'testing-library': testingLibrary,
    typescript: typescriptConfig,
    vitest: vitestConfig,
  },
};
