import type { Linter } from "eslint";

import eslintPluginTestingLibrary from "eslint-plugin-testing-library";

export const testingLibraryConfig: Linter.Config = {
  ...eslintPluginTestingLibrary.configs["flat/react"],
  name: "@codefast/style-guide/configs/testing/testing-library",
};
