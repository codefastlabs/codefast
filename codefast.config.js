import { execSync } from "node:child_process";

/**
 * Codefast monorepo tooling — sections are read by matching `codefast` subcommands.
 *
 * @type {import("@codefast/cli").CodefastConfig}
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
    // Every module is an entry point — sole-consumer repo, nothing to encapsulate against. `strip`
    // keeps the introspection entry points at the specifiers they shipped under before those
    // modules moved into `src/introspection/` (`./graph-adapters/*`, `./dependency-graph`).
    "@codefast/di": {
      strip: "./introspection/",
    },
    // Generate exports from dist/ like every other library package; the css directory is a
    // raw source passthrough (no build output), so it needs an explicit mapping.
    "@codefast/tracking": {
      exports: {
        "./css/*": "./src/css/*",
      },
    },
    "@apps/web": false,
    "@examples/tanstack-start": false,
    "@codefast/cli": false,
    // Node lane is tsc; the browser app is a Vite bundle whose hashed chunks in
    // dist/app must not be turned into package exports — exports are hand-kept.
    "@internal/benchmark-viewer": false,
    "@benchmark/tailwind-variants": false,
    "@codefast/typescript-config": false,
  },

  arrange: {
    onAfterWrite: ({ files }) => {
      execSync(`oxfmt ${files.join(" ")}`, { stdio: "inherit" });
    },
  },

  audit: {
    comments: {
      allowlist: [],
    },
    imports: {
      allowlist: [],
    },
    displayNames: {
      allowlist: [],
    },
    constants: {
      target: "packages/di/src",
      allowlist: [
        // The generated tier's trigger is a measured policy, the one count the record keeps by name.
        "PLAN_CODEGEN_THRESHOLD",
        // A graph export's starting cell, in pixels a viewer re-lays out; no contract fixes it.
        "GRID_CELL_WIDTH_PX",
        "GRID_CELL_HEIGHT_PX",
      ],
    },
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
    // Every benchmark suite's baselines/ holds exactly the run bench:baseline pins, and every
    // runs/ entry is cited by a link from some tracked document — see each suite's package.json.
    runs: {
      target: "benchmarks/*",
    },
  },

  tag: {
    // Glob patterns (picomatch) — skip every private app under the @apps scope.
    skipPackages: ["@apps/*", "@examples/*"],
  },
};

export default config;
