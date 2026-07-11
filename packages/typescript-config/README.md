# @codefast/typescript-config

Shared TypeScript configuration presets — one strict, bundler-first base plus focused variants for libraries, React, and Next.js.

[![npm version](https://img.shields.io/npm/v/@codefast/typescript-config)](https://www.npmjs.com/package/@codefast/typescript-config) [![license](https://img.shields.io/npm/l/@codefast/typescript-config)](https://github.com/codefastlabs/codefast/blob/main/LICENSE)

## Installation

```bash
pnpm add -D @codefast/typescript-config
```

TypeScript >= 5.0 is a peer dependency (`moduleResolution: "bundler"` requires it). The package ships plain JSON — it adds no runtime code.

## Usage

Extend the preset that matches your project in `tsconfig.json`. Keep the `.json` extension — the package export map only exposes the full file names.

A generic TypeScript project:

```json
{
  "extends": "@codefast/typescript-config/base.json",
  "include": ["src"]
}
```

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

Options you set locally always win, so overriding a preset value is a one-line change:

```json
{
  "extends": "@codefast/typescript-config/library.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ESNext"]
  }
}
```

## Presets

| Preset         | Extends     | Purpose                                                                                   |
| -------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `base.json`    | —           | Strict, bundler-first baseline: ESNext target/module, DOM + ESNext libs, type-check only. |
| `library.json` | `base.json` | Headless packages: drops the DOM libs so reliance on browser globals is a type error.     |
| `react.json`   | `base.json` | React 17+ automatic JSX transform (`jsx: "react-jsx"`) — no `React` import needed.        |
| `next.json`    | `base.json` | Next.js apps: `jsx: "preserve"`, incremental builds, and the `next` TypeScript plugin.    |

## Notable compiler options

All strictness comes from `base.json`, so every preset inherits it:

- `strict` — the full strict family (`strictNullChecks`, `noImplicitAny`, and friends).
- `noUncheckedIndexedAccess` — indexed access is typed `T | undefined`, forcing explicit handling.
- `isolatedModules` + `moduleDetection: "force"` — every file is a module and must transpile in isolation, as bundlers require.
- `module: "ESNext"` + `moduleResolution: "bundler"` — modern ESM with bundler-style `exports`/`imports` resolution.
- `noEmit` — presets type-check only; emitting is your bundler's job (override in a build config if `tsc` emits for you).
- `forceConsistentCasingInFileNames` — catches import-path casing mismatches before they break case-sensitive CI.

## License

MIT — see [LICENSE](https://github.com/codefastlabs/codefast/blob/main/LICENSE).
