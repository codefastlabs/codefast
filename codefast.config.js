/**
 * Codefast monorepo tooling — `mirror` is read by `codefast mirror sync`.
 * Legacy `generate-exports.config.js` / `.json` is still supported if absent.
 */
const config = {
  mirror: {
    // Packages to skip (relative paths from workspace root)
    skipPackages: ["packages/tailwind-variants", "packages/cli"],

    // Path transformations for specific packages
    pathTransformations: {
      "packages/ui": {
        removePrefix: "./components/",
      },
    },

    // Custom exports that should be preserved/overridden per package
    customExports: {
      "packages/ui": {
        "./css/*": "./src/css/*",
      },
    },
  },
};

export default config;
