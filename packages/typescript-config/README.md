# @codefast/typescript-config

Shared TypeScript configuration presets for projects that want one strict, bundler-first baseline and small, focused
variants for libraries, React, and Next.js.

[![npm version](https://img.shields.io/npm/v/@codefast/typescript-config)](https://www.npmjs.com/package/@codefast/typescript-config)
[![license](https://img.shields.io/npm/l/@codefast/typescript-config)](./LICENSE)

## Overview

`@codefast/typescript-config` gives you one strict, bundler-first TypeScript baseline and a few focused variants — for
libraries, React, and Next.js. Extend the preset that fits your project, then override anything you need locally.

The presets are plain JSON `tsconfig` files. There's no runtime code, and nothing to import.

- **Strict by default.** `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, and `verbatimModuleSyntax` come
  from the base that every preset extends.
- **Bundler-first.** An ESNext `module` with `moduleResolution: "bundler"`, so `exports` and `imports` maps resolve the
  way Vite, esbuild, and friends resolve them.
- **`lib` and `target` match the Node floor** (`engines.node >= 24`): both are `ES2025`, the newest edition Node 24
  fully supports, and `lib` adds `ESNext.Disposable` for the explicit resource management Node 24 ships natively. A
  builtin newer than both, such as `Map.prototype.getOrInsert`, is a type error here rather than a runtime crash on the
  floor. Move them together only when the floor moves.
- **Type-check only.** The presets set `noEmit`; a separate build overlay turns on emit and `.d.ts` generation.
- **Plain JSON.** No runtime code, nothing to import.

## Installation

```bash
pnpm add -D @codefast/typescript-config
```

`@codefast/typescript-config` requires Node.js 24 or later, and `typescript` 7 or later as a peer dependency —
TypeScript 7 is the one compiler the presets are checked against. The package is published on 0.x and versioned on its
own track: breaking changes ship as minor versions, so pin the minor version when you need stability.

## Quick start

Extend the preset that matches your project in `tsconfig.json`. Keep the `.json` extension — the package exports the
full file names only.

```json
{
  "extends": "@codefast/typescript-config/base.json",
  "include": ["src"]
}
```

Options you set locally always win, so overriding a preset value takes one line:

```json
{
  "extends": "@codefast/typescript-config/library.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2025", "ESNext.Disposable"]
  }
}
```

## Presets

| Preset               | Extends     | Purpose                                                                                                                                           |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.json`          | —           | Strict, bundler-first baseline: ES2025 target, ESNext module, DOM + ES2025 + `ESNext.Disposable` libs, type-check only.                           |
| `library.json`       | `base.json` | Headless packages: `lib` is `ES2025` and `ESNext.Disposable` only, so relying on a browser global is a type error.                                |
| `react.json`         | `base.json` | React with the automatic JSX runtime (`jsx: "react-jsx"`) — components need no `React` import.                                                    |
| `next.json`          | `base.json` | Next.js apps: `jsx: "preserve"`, `incremental` builds, and the `next` TypeScript plugin.                                                          |
| `library-build.json` | (overlay)   | Build-emit overrides for a build config: `noEmit: false`, `declaration` + `isolatedDeclarations`, declaration and source maps, `types: ["node"]`. |

### Choosing a preset

A publishable package with no browser coupling:

```json
{
  "extends": "@codefast/typescript-config/library.json",
  "include": ["src"]
}
```

A React app or component library:

```json
{
  "extends": "@codefast/typescript-config/react.json",
  "include": ["src"]
}
```

A Next.js app:

```json
{
  "extends": "@codefast/typescript-config/next.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"]
}
```

Next.js 16.3 and later type-check with TypeScript 7 through its `tsc` CLI (`experimental.useTypeScriptCli`, on by
default). Earlier Next.js releases need TypeScript 6's compiler API, so an app on one of them stays on 0.9.x of this
package.

### Building with `tsc`

`library-build.json` is an overlay, not a standalone preset. It carries only the emit options, so layer it over your
development config in a separate `tsconfig.build.json`. List both in `extends` to keep the strictness from
`library.json` and add `.d.ts` emit on top:

```json
{
  "extends": ["./tsconfig.json", "@codefast/typescript-config/library-build.json"],
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.test.ts"]
}
```

Then `tsc -p tsconfig.build.json` emits `.js`, `.d.ts`, and their maps into `dist/`. `isolatedDeclarations` requires an
explicit type annotation on every export, which is what lets declarations be produced file by file.

## Notable compiler options

Every preset inherits its strictness from `base.json`:

- `strict` — the full strict family (`strictNullChecks`, `noImplicitAny`, and friends).
- `noUncheckedIndexedAccess` — indexed access is typed `T | undefined`, forcing explicit handling.
- `noImplicitOverride` — a method that overrides a base-class member must say `override`.
- `verbatimModuleSyntax` — type-only imports must be written `import type`, so a transpiler can drop them without type
  information.
- `isolatedModules` + `moduleDetection: "force"` — every file is a module and must transpile in isolation, as bundlers
  require.
- `module: "ESNext"` + `moduleResolution: "bundler"` — modern ESM with bundler-style `exports`/`imports` resolution.
- `noEmit` — presets type-check only; emitting is your bundler's job, or `library-build.json`'s when `tsc` builds for
  you.
- `forceConsistentCasingInFileNames` — catches import-path casing mismatches before they break case-sensitive CI.
- `skipLibCheck`, `esModuleInterop`, `resolveJsonModule` — pragmatic defaults for consuming third-party packages and
  JSON.

## Documentation

- [codefastlabs.com/docs/typescript-config](https://codefastlabs.com/docs/typescript-config) — this document, rendered.
- [`CHANGELOG.md`](./CHANGELOG.md) — release notes for every published version.

## Contributing

The package is developed in the [codefast monorepo](https://github.com/codefastlabs/codefast); the repo-wide
[contributing guide](../../CONTRIBUTING.md) covers setup, the test taxonomy, and the release flow.

## License

Released under the [MIT License](./LICENSE).
