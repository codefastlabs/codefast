# @codefast/typescript-config

Shared TypeScript compiler configurations for the `codefast` ecosystem — one strict base preset plus focused specialisations for libraries, React, and Next.js.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/typescript-config.svg)](https://www.npmjs.com/package/@codefast/typescript-config)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/typescript-config.svg)](https://www.npmjs.com/package/@codefast/typescript-config)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Presets](#presets)
  - [base.json](#basejson)
  - [library.json](#libraryjson)
  - [react.json](#reactjson)
  - [next.json](#nextjson)
- [Usage Recipes](#usage-recipes)
- [Strictness at a Glance](#strictness-at-a-glance)
- [Compatibility](#compatibility)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

---

## Overview

This package ships four JSON files that you reference from your project's `tsconfig.json` via `extends`. Every preset inherits from `base.json`, so each specialisation only layers on the options it actually needs.

Design goals:

- **Strict by default** — full `strict` mode plus `noUncheckedIndexedAccess`.
- **Modern targets** — `ESNext` target and module, tuned for bundler-driven builds.
- **Bundler-first** — `moduleResolution: "bundler"` works cleanly with Vite, Turbopack, esbuild, webpack 5, Next.js, Rollup / Rolldown, and `tsdown`.
- **Tree-shakeable ESM** — `isolatedModules` + `moduleDetection: "force"` guarantee every file is a module.
- **No emit** — the preset assumes a separate bundler or transpiler is responsible for output (`noEmit: true`).

## Requirements

- TypeScript **>= 5.0** — `moduleResolution: "bundler"` requires TS 5.0+ (declared as a `peerDependency`)

No runtime dependency is added to your application — the package is pure JSON.

## Installation

```bash
pnpm add -D @codefast/typescript-config
# or
npm install --save-dev @codefast/typescript-config
# or
yarn add -D @codefast/typescript-config
```

## Quick Start

Pick the preset closest to your project type and `extends` it:

```json5
// tsconfig.json
{
  extends: "@codefast/typescript-config/base.json",
  include: ["src/**/*"],
  exclude: ["node_modules", "dist"],
}
```

Override or extend any option locally. Overrides applied in the consumer's `tsconfig.json` always win.

## Presets

| Preset         | Inherits    | `lib`                       | `jsx`       | Extra                                        | When to use                                     |
| -------------- | ----------- | --------------------------- | ----------- | -------------------------------------------- | ----------------------------------------------- |
| `base.json`    | —           | `DOM, DOM.Iterable, ESNext` | —           | —                                            | Generic TypeScript projects (CLIs, scripts).    |
| `library.json` | `base.json` | `ESNext` (DOM removed)      | —           | —                                            | Publishable packages with no browser coupling.  |
| `react.json`   | `base.json` | (inherited)                 | `react-jsx` | —                                            | React apps and component libraries (React 17+). |
| `next.json`    | `base.json` | (inherited)                 | `preserve`  | `incremental`, `plugins: [{ name: "next" }]` | Next.js apps (App Router or Pages Router).      |

### base.json

Sets the strict, modern baseline used by every other preset.

```json
{
  "compilerOptions": {
    "allowJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "noEmit": true,
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ESNext"
  }
}
```

| Option                             | Value                       | Why                                                                                       |
| ---------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| `strict`                           | `true`                      | Turns on the full strict family (`strictNullChecks`, `noImplicitAny`, etc.).              |
| `noUncheckedIndexedAccess`         | `true`                      | `arr[i]` and `obj[key]` are typed `T \| undefined` — forces explicit handling.            |
| `target`                           | `ESNext`                    | Compile to the newest JavaScript; the bundler / runtime downlevels if needed.             |
| `module` / `moduleResolution`      | `ESNext` / `bundler`        | Native ESM output with bundler-style `exports`/`imports` resolution.                      |
| `moduleDetection`                  | `force`                     | Treats every file as a module — no accidental global script files.                        |
| `isolatedModules`                  | `true`                      | Each file must be transpilable in isolation (required by esbuild, swc, Vite, Babel).      |
| `lib`                              | `DOM, DOM.Iterable, ESNext` | Browser globals + the current ECMAScript surface.                                         |
| `noEmit`                           | `true`                      | Type-checking only — emit is handled by tsdown / tsc-on-the-side / bundler.               |
| `allowJs`                          | `true`                      | Permits mixed `.js`/`.ts` codebases.                                                      |
| `resolveJsonModule`                | `true`                      | `import data from "./file.json"` works out of the box.                                    |
| `esModuleInterop`                  | `true`                      | Interop with CommonJS default imports.                                                    |
| `forceConsistentCasingInFileNames` | `true`                      | Catches import-path casing mismatches across macOS / Linux CI.                            |
| `skipLibCheck`                     | `true`                      | Skips type-checking of declaration files — faster, and sidesteps noisy third-party types. |

### library.json

Drops `DOM` / `DOM.Iterable` so accidental reliance on browser globals surfaces as a type error. Use for headless packages (utilities, server-side code, SDKs).

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ESNext"]
  }
}
```

If a given library genuinely needs DOM types (e.g. the UI component library in this repo), re-add them locally — see [Troubleshooting](#conflicting-lib-settings).

### react.json

Enables the React 17+ automatic JSX transform so components don't need `import React from "react"`.

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

### next.json

Next.js owns the JSX transform itself, so `jsx` is set to `preserve` and incremental build caching is enabled. The `next` TypeScript plugin adds Route-type awareness and IDE features.

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "incremental": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }]
  }
}
```

## Usage Recipes

### TypeScript library package (tsdown / tsc build)

```json5
{
  extends: "@codefast/typescript-config/library.json",
  compilerOptions: {
    outDir: "./dist",
    declaration: true,
    declarationMap: true,
  },
  include: ["src/**/*"],
  exclude: ["dist", "**/*.test.ts", "**/*.test.tsx"],
}
```

Since the preset leaves `noEmit: true`, many packages split responsibilities:

- `tsconfig.json` — for editors & `tsc --noEmit` type-checking.
- `tsconfig.build.json` — extends the same preset but sets `"noEmit": false` (or no override needed if your build tool emits directly).

### React component library

```json5
{
  extends: "@codefast/typescript-config/react.json",
  compilerOptions: {
    lib: ["DOM", "DOM.Iterable", "ESNext"],
    outDir: "./dist",
  },
  include: ["src/**/*"],
}
```

### Next.js application

```json5
{
  extends: "@codefast/typescript-config/next.json",
  include: ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  exclude: ["node_modules"],
}
```

### Monorepo package with internal subpath imports

Pair the preset with `package.json#imports` for readable internal paths:

```json5
// package.json
{
  type: "module",
  imports: {
    "#/*": ["./src/*", "./src/*.ts", "./src/*.tsx"],
  },
}
```

`moduleResolution: "bundler"` resolves `#/*` specifiers natively — no `paths` mapping needed.

## Strictness at a Glance

Some consequences of the strict defaults are easy to miss. Expect the following to be errors out of the box:

| Pattern                                           | Why it fails                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `const first = arr[0].name`                       | `noUncheckedIndexedAccess` — `arr[0]` is `T \| undefined`.                   |
| `function f(x) { return x + 1 }`                  | `strict` — `x` has an implicit `any`.                                        |
| `let value; value = doSomething();`               | Depending on `doSomething()`'s return, may be `undefined`.                   |
| `// @ts-ignore` without a reason                  | Not auto-forbidden, but `@ts-expect-error` is preferred when you want noise. |
| Forgetting `void` on a boolean-returning callback | `strictFunctionTypes` can flip arity / return-type compatibility.            |

Add narrowing / guards rather than relaxing these options in downstream configs.

## Compatibility

| Ecosystem   | Works with               | Notes                                             |
| ----------- | ------------------------ | ------------------------------------------------- |
| TypeScript  | `>= 5.0`                 | Needed for `moduleResolution: "bundler"`.         |
| Vite        | 5.x, 6.x                 | Pairs with `bundler` resolution; no extra config. |
| Turbopack   | Current Next.js releases | Pairs with `next.json`.                           |
| webpack     | 5.x                      | Use with `ts-loader` or `babel-loader`.           |
| esbuild     | `>= 0.19`                | Requires `isolatedModules` (already enabled).     |
| swc / Babel | Current                  | Honour `isolatedModules`; no decorator metadata.  |
| React       | 17, 18, 19               | `react.json` ships `react-jsx` (no React import). |
| Next.js     | 13+ (App Router)         | `next.json` wires the `next` TS plugin.           |
| Node.js     | Any LTS                  | This package is configuration only — no runtime.  |

## Troubleshooting

### Cannot find preset / "Cannot find module @codefast/typescript-config/..."

Ensure the package is installed as a dev dependency in the consumer project and that your `tsconfig.json` extends the full file name:

```json5
{
  extends: "@codefast/typescript-config/react.json",
}
```

Don't drop the `.json` extension — TypeScript resolves these as files, not packages.

### Conflicting `lib` settings

If you're using `library.json` but need DOM types (e.g. a React-targeting package), override `lib` locally:

```json5
{
  extends: "@codefast/typescript-config/library.json",
  compilerOptions: {
    lib: ["DOM", "DOM.Iterable", "ESNext"],
  },
}
```

### "Cannot use JSX unless the '--jsx' flag is provided"

The base preset does not set `jsx` — switch to `react.json` or `next.json` depending on your bundler:

```json5
{ extends: "@codefast/typescript-config/react.json" }
```

or

```json5
{ extends: "@codefast/typescript-config/next.json" }
```

### `noUncheckedIndexedAccess` errors you don't want

If you truly don't want `T | undefined` for indexed access in a specific project (e.g. generated code), override it locally:

```json5
{
  extends: "@codefast/typescript-config/base.json",
  compilerOptions: {
    noUncheckedIndexedAccess: false,
  },
}
```

Prefer narrowing (`if (value === undefined) return;` or `value?.foo`) to disabling the check.

### Emitting output despite `noEmit: true`

The preset sets `noEmit: true` because the assumption is a separate bundler (tsdown, Vite, Next.js…) does the emitting. For a tsc-driven build, override in a dedicated `tsconfig.build.json`:

```json5
{
  extends: "@codefast/typescript-config/library.json",
  compilerOptions: {
    noEmit: false,
    declaration: true,
    outDir: "./dist",
  },
  include: ["src/**/*"],
  exclude: ["**/*.test.ts", "**/*.test.tsx"],
}
```

### Incremental build cache gets out of sync (Next.js)

Delete the stale `.tsbuildinfo` and rebuild:

```bash
rm -f tsconfig.tsbuildinfo .next/types
pnpm build
```

## Contributing

Contributions are welcome. See the repository-root [contributing guide](../../README.md#contributing).

This package is configuration-only — there's nothing to build or test in isolation. Changes should be validated by running the full repo checks:

```bash
# type-check every package
pnpm check-types

# lint & format
pnpm lint
pnpm format
```

## License

MIT — see the repository-level [LICENSE](../../LICENSE).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history.
