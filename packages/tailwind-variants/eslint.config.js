import { composeConfig, libraryPreset } from "@codefast/eslint-config";

export default composeConfig(libraryPreset, [
  {
    rules: {
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unnecessary-type-constraint": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
]);
