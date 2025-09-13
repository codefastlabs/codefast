import baseConfig from "@codefast/eslint-config";

export default [
  ...baseConfig,
  {
    ignores: ["node_modules", "dist"],
  },
];
