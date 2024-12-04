import { config as recommended } from './configs/recommended.js';
import { config as jestConfig } from './configs/testing/jest.js';
import { config as jestTypescript } from './configs/testing/jest-typescript.js';
import { config as nextConfig } from './configs/frameworks/next.js';
import { config as playwrightTest } from './configs/testing/playwright-test.js';
import { config as reactConfig } from './configs/frameworks/react.js';
import { config as testingLibrary } from './configs/testing/testing-library.js';
import { config as typescriptConfig } from './configs/core/typescript.js';
import { config as vitestConfig } from './configs/testing/vitest.js';

export const config = {
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
