import { config } from "@codefast/eslint-config/next";

/**
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import('eslint').Linter.Config[]}
 */
const nextConfig = [
  ...config,
  {
    files: ["next.config.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
    },
  },
];

export default nextConfig;
