// Core exports - JavaScript, TypeScript, Import, and Unicorn rules
export { baseJavaScriptRules } from "@/core/javascript";
export { typescriptRules } from "@/core/typescript";
export { importRules } from "@/core/import";
export { unicornRules } from "@/core/unicorn";

// Environment exports - Node.js, Browser and Testing environments
export { nodeEnvironment } from "@/environments/node";
export { browserEnvironment } from "@/environments/browser";
export { testEnvironment } from "@/environments/test";

// Language exports - JSON, CSS and Markdown rules
export { jsonRules } from "@/languages/json";
export { cssRules } from "@/languages/css";
export { markdownRules } from "@/languages/markdown";

// Framework exports - React, Next.js and JSX accessibility rules
export { reactRules } from "@/frameworks/react";
export { nextRules } from "@/frameworks/next";
export { jsxA11yRules } from "@/frameworks/jsx-a11y";

// Testing exports - Jest rules
export { jestRules } from "@/testing/jest";

// Utility exports - Warning only rules, Prettier, TSDoc and Turbo rules
export { onlyWarnRules } from "@/utils/only-warn";
export { prettierRules } from "@/utils/prettier";
export { tsdocRules } from "@/utils/tsdoc";
export { turboRules } from "@/utils/turbo";

// Preset exports - Base, Library, React App and Next.js App presets
export { basePreset } from "@/presets/base";
export { libraryPreset } from "@/presets/library";
export { reactAppPreset } from "@/presets/react-app";
export { nextAppPreset } from "@/presets/next-app";

// Utility exports - Configuration composer
export { composeConfig } from "@/utils/composer";
