import { composeConfig, nextAppPreset } from "@codefast/eslint-config";

export default composeConfig(nextAppPreset, [
  {
    rules: {
      "jsx-a11y/anchor-is-valid": "off",
    },
  },
]);
