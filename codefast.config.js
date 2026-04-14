/**
 * Codefast monorepo tooling — `mirror` is read by `codefast mirror sync`.
 * Legacy `generate-exports.config.js` / `.json` is still supported if absent.
 */
const config = {
  mirror: {
    // Packages to skip (relative paths from workspace root)
    customExports: {
      "@codefast/ui": {
        "./css/*": "./src/css/*",
      },
    },

    // Path transformations for specific packages
    pathTransformations: {
      "@codefast/ui": {
        removePrefix: "./components/",
      },
    },

    // Custom exports that should be preserved/overridden per package
    skipPackages: [
      "@apps/docs",
      "@codefast/cli",
      "@codefast/benchmark-tailwind-variants",
      "@codefast/tailwind-variants",
      "@codefast/typescript-config",
    ],
  },
  tag: {
    // Custom exports that should be preserved/overridden per package
    skipPackages: ["@apps/docs", "@codefast/benchmark-tailwind-variants"],
  },
};

export default config;
