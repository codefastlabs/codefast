import { composeConfig, nextPreset } from "@codefast/eslint-config";

export default composeConfig(nextPreset, [
  {
    rules: {
      "jsx-a11y/anchor-is-valid": "off",
    },
  },
]);
