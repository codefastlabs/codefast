import { execSync } from "node:child_process";

/**
 * Codefast monorepo tooling — `mirror` is read by `codefast mirror sync`.
 */
const config = {
  mirror: {
    "@codefast/ui": {
      pathTransformations: {
        removePrefix: "./components/",
      },
      customExports: {
        "./css/*": "./src/css/*",
      },
    },
    "@codefast/tailwind-variants": {
      custom: true,
    },
    "@apps/docs": false,
    "@codefast/cli": false,
    "@codefast/benchmark-tailwind-variants": false,
    "@codefast/typescript-config": false,
  },

  arrange: {
    onAfterWrite: ({ files }) => {
      execSync(`oxfmt ${files.join(" ")}`, { stdio: "inherit" });
    },
  },

  tag: {
    skipPackages: ["@apps/docs"],
  },
};

export default config;
