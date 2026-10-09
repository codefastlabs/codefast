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
      // The message-scroller hooks and lib are the primitive's internals; its public types ship from the primitive.
      exclude: [
        "./hooks/use-message-scroller-commands",
        "./hooks/use-message-scroller-controller",
        "./hooks/use-message-scroller-refs",
        "./lib/message-scroller/*",
      ],
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
    "@apps/web": false,
    "@examples/tanstack-start": false,
    "@codefast/cli": false,
    // Node lane is tsc; the browser app is a Vite bundle whose hashed chunks in
    // dist/app must not be turned into package exports — exports are hand-kept.
    "@internal/benchmark-viewer": false,
    // A build script, not a library: its dist/ is the design-system artifact's files.
    "@internal/design-system": false,
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
    // A kept double assertion carries its reason inline, beside the code it excuses.
    assertions: {
      allowlist: [],
    },
    displayNames: {
      allowlist: [],
    },
    // A layer is a family under `src/`: a directory, or a lone module sitting flat. Bottom to top; a
    // value import may point down or sideways, never up. Each package's ARCHITECTURE.md explains its order.
    layers: {
      packages: {
        "@codefast/di": {
          layers: [
            ["core", "errors.ts", "injection"],
            ["metadata"],
            ["ambient-container.ts", "lifecycle", "decorators"],
            ["resolution"],
            ["introspection"],
            ["container"],
            ["index.ts"],
          ],
        },
      },
      allowlist: [],
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
  },

  tag: {
    // Glob patterns (picomatch) — skip every private app under the @apps scope.
    skipPackages: ["@apps/*", "@examples/*"],
  },
};

export default config;
