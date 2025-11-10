import { reactPreset } from "@codefast/eslint-config/presets/react";
import { composeConfig } from "@codefast/eslint-config/shared/composer";

export default composeConfig(reactPreset, {
  rules: {},
});
