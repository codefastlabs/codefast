/**
 * Configuration for generate-exports script
 * This file takes priority over generate-exports.config.json if both exist
 *
 */
const config = {
  // Packages to skip (relative paths from workspace root)
  skipPackages: ["packages/tailwind-variants"],

  // Path transformations for specific packages
  pathTransformations: {
    "packages/ui": {
      removePrefix: "./components/",
    },
  },
};

export default config;
