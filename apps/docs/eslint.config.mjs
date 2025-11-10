import { nextPreset } from "@codefast/eslint-config/presets/next";
import { composeConfig } from "@codefast/eslint-config/shared/composer";

export default composeConfig(nextPreset, [
  {
    rules: {
      "jsx-a11y/anchor-is-valid": "off",
    },
  },
]);
