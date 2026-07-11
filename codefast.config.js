import { execSync } from "node:child_process";

/**
 * Codefast monorepo tooling — `mirror` is read by `codefast mirror sync`.
 */
const config = {
  mirror: {
    "@codefast/ui": {
      strip: "./components/",
      exports: {
        "./css/*": "./src/css/*",
      },
    },
    "@codefast/tailwind-variants": {
      preserve: true,
    },
    // Hand-curated group entries (dist/ has ~50 modules; regeneration would re-expose them all).
    "@codefast/tracking": {
      preserve: true,
    },
    "@apps/ui": false,
    "@examples/tanstack-start": false,
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
    // Glob patterns (picomatch) — skip every private app under the @apps scope.
    skipPackages: ["@apps/*", "@examples/*"],
  },
};

export default config;
