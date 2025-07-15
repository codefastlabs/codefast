import { libraryPreset, composeConfig } from "@codefast/eslint-config";

export default composeConfig(libraryPreset, [
  {
    rules: {
      "no-console": "off",
    },
  },
]);
