export { baseJavaScriptRules } from "@/core/javascript";
export { typescriptRules } from "@/core/typescript";
export { importRules } from "@/core/import";
export { unicornRules } from "@/core/unicorn";

export { nodeEnvironment } from "@/environments/node";
export { browserEnvironment } from "@/environments/browser";
export { testEnvironment } from "@/environments/test";

export { jsonRules } from "@/languages/json";
export { cssRules } from "@/languages/css";
export { markdownRules } from "@/languages/markdown";

export { reactRules } from "@/frameworks/react";
export { nextRules } from "@/frameworks/next";
export { jsxA11yRules } from "@/frameworks/jsx-a11y";

export { jestRules } from "@/testing/jest";

export { onlyWarnRules } from "@/utils/only-warn";
export { prettierRules } from "@/utils/prettier";
export { tsdocRules } from "@/utils/tsdoc";
export { turboRules } from "@/utils/turbo";

export { basePreset } from "@/presets/base";
export { libraryPreset } from "@/presets/library";
export { reactAppPreset } from "@/presets/react-app";
export { nextAppPreset } from "@/presets/next-app";

export { composeConfig } from "@/utils/composer";
