/**
 * Configuration for generate-exports script
 * This file takes priority over generate-exports.config.json if both exist
 *
 */
const config = {
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
};

export default config;
