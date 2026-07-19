import { execSync } from "node:child_process";

/**
 * Codefast monorepo tooling — sections are read by matching `codefast` subcommands.
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
    // Generate exports from dist/ like every other library package; the css directory is a
    // raw source passthrough (no build output), so it needs an explicit mapping.
    "@codefast/tracking": {
      exports: {
        "./css/*": "./src/css/*",
      },
    },
    "@apps/ui": false,
    "@examples/tanstack-start": false,
    "@codefast/cli": false,
    // Node lane is tsc; the browser app is a Vite bundle whose hashed chunks in
    // dist/app must not be turned into package exports — exports are hand-kept.
    "@codefast/benchmark-viewer": false,
    "@codefast/benchmark-tailwind-variants": false,
    "@codefast/typescript-config": false,
  },

  arrange: {
    onAfterWrite: ({ files }) => {
      execSync(`oxfmt ${files.join(" ")}`, { stdio: "inherit" });
    },
  },

  audit: {
    rtl: {
      target: "packages/ui/src",
      // Sheet: slides live in tv() side (left/right) buckets — the side is physical,
      // so the physical slide is correct; the detector cannot see that tv() context.
      allowlist: [
        "packages/ui/src/variants/sheet.ts:data-open:slide-in-from-left-10",
        "packages/ui/src/variants/sheet.ts:data-closed:slide-out-to-left-10",
        "packages/ui/src/variants/sheet.ts:data-open:slide-in-from-right-10",
        "packages/ui/src/variants/sheet.ts:data-closed:slide-out-to-right-10",
      ],
    },
  },

  tag: {
    // Glob patterns (picomatch) — skip every private app under the @apps scope.
    skipPackages: ["@apps/*", "@examples/*"],
  },
};

export default config;
