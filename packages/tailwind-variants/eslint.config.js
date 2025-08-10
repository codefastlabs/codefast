import { composeConfig, reactAppPreset } from "@codefast/eslint-config";

export default composeConfig(reactAppPreset, [
  {
    rules: {
      "@typescript-eslint/no-unnecessary-type-constraint": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
]);
