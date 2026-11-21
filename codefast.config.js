/**
 * Codefast monorepo tooling — each section configures the `codefast` commands of the same name.
 *
 * @type {import("@codefast/cli").CodefastConfig}
 */
const config = {
  exports: {
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
    "@codefast/tv": {
      preserve: true,
    },
    // Generate exports from dist/ like every other library package; the css directory is a
    // raw source passthrough (no build output), so it needs an explicit mapping.
    "@codefast/tracking": {
      exports: {
        "./css/*": "./src/css/*",
      },
    },
    "@apps/*": false,
    "@codefast/cli": false,
    // Node lane is tsc; the browser app is a Vite bundle whose hashed chunks in
    // dist/app must not be turned into package exports — exports are hand-kept.
    "@internal/benchmark-viewer": false,
    // A build script, not a library: its dist/ is the design-system artifact's files.
    "@internal/design-system": false,
    "@benchmark/tailwind-variants": false,
    "@codefast/typescript-config": false,
  },

  audit: {
    // The house import policy: React members by name, and Zod as a namespace everywhere, so a named `z` never
    // pins Zod's full locale set into a package that ships bundled.
    imports: {
      rules: [
        {
          module: "react",
          ban: ["namespace", "default"],
          umdGlobal: "React",
          message: 'import React members by name from "react"',
        },
        {
          module: "zod",
          ban: ["named:z"],
          message:
            'import Zod as a namespace: import * as z from "zod" (repo house form; a named import { z } pins Zod\'s ' +
            "full locale set into any bundle that reaches it)",
        },
      ],
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
    },
    tailwindRtl: {
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

  // Keyed by package name or glob, like `exports`: the apps ship no API to stamp.
  since: {
    "@apps/*": false,
  },
};

export default config;
