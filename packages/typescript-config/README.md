# @codefast/typescript-config

Shared TypeScript configuration presets providing standardized compiler settings for different project types including base projects, libraries, React applications, and Next.js.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/typescript-config.svg)](https://www.npmjs.com/package/@codefast/typescript-config)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/typescript-config.svg)](https://www.npmjs.com/package/@codefast/typescript-config)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Base Configuration](#base-configuration)
  - [Library Configuration](#library-configuration)
  - [React Configuration](#react-configuration)
  - [Next.js Configuration](#nextjs-configuration)
- [Configurations](#configurations)
- [API Reference](#api-reference)
- [Compatibility](#compatibility)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

## Overview

`@codefast/typescript-config` provides opinionated, strict TypeScript presets that can be extended in any project. Each preset is tuned for a specific project type, so you get the right compiler options without manual configuration.

**Key features:**

- **Strict Type Checking** -- Enables all strict options for maximum type safety.
- **Modern JavaScript** -- Targets ESNext with full ESNext lib support.
- **Bundler Module Resolution** -- Optimized for modern bundlers (Vite, Turbopack, esbuild).
- **JavaScript Support** -- Allows `.js` files alongside TypeScript.
- **JSON Support** -- Resolves JSON modules natively.
- **Isolated Modules** -- Transpile each file separately for faster builds.

## Installation

```bash
pnpm add -D @codefast/typescript-config
```

Or using npm:

```bash
npm install --save-dev @codefast/typescript-config
```

**Requirements:**

- Node.js >= 24.0.0 (LTS)
- TypeScript >= 5.0.0

## Quick Start

Create a `tsconfig.json` in your project root and extend from the appropriate preset:

```json
{
  "extends": "@codefast/typescript-config/base.json"
}
```

## Usage

### Base Configuration

For general TypeScript projects:

```json
{
  "extends": "@codefast/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Library Configuration

For NPM packages and shared libraries (no DOM libs):

```json
{
  "extends": "@codefast/typescript-config/library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declarationDir": "./dist/types"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### React Configuration

For React components and applications:

```json
{
  "extends": "@codefast/typescript-config/react.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Next.js Configuration

For Next.js applications:

```json
{
  "extends": "@codefast/typescript-config/next.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Configurations

### Available Presets

| Configuration  | Extends     | Description                                      | Use Case                       |
| -------------- | ----------- | ------------------------------------------------ | ------------------------------ |
| `base.json`    | --          | Strict base configuration with ESNext target     | All TypeScript projects        |
| `library.json` | `base.json` | ESNext-only libs (no DOM)                        | NPM packages, shared libraries |
| `react.json`   | `base.json` | Adds `react-jsx` transform                       | React components and apps      |
| `next.json`    | `base.json` | Incremental builds, JSX preserve, Next.js plugin | Next.js applications           |

### Base Configuration Details

| Option              | Value                       | Purpose                                  |
| ------------------- | --------------------------- | ---------------------------------------- |
| `strict`            | `true`                      | Enables all strict type-checking options |
| `target`            | `ESNext`                    | Latest JavaScript features               |
| `module`            | `ESNext`                    | ESM module system                        |
| `moduleResolution`  | `bundler`                   | Optimized for modern bundlers            |
| `lib`               | `DOM, DOM.Iterable, ESNext` | Browser and ESNext APIs                  |
| `isolatedModules`   | `true`                      | File-level transpilation                 |
| `noEmit`            | `true`                      | Lets the bundler handle output           |
| `allowJs`           | `true`                      | JavaScript file support                  |
| `resolveJsonModule` | `true`                      | JSON import support                      |
| `esModuleInterop`   | `true`                      | CommonJS/ESM interop                     |
| `skipLibCheck`      | `true`                      | Skip type checking of declaration files  |

### Library Configuration Details

Extends `base.json` with:

| Option | Value    | Purpose                                                       |
| ------ | -------- | ------------------------------------------------------------- |
| `lib`  | `ESNext` | No DOM libs -- library code should not depend on browser APIs |

### React Configuration Details

Extends `base.json` with:

| Option | Value       | Purpose                                         |
| ------ | ----------- | ----------------------------------------------- |
| `jsx`  | `react-jsx` | Modern JSX transform (no `import React` needed) |

### Next.js Configuration Details

Extends `base.json` with:

| Option        | Value                  | Purpose                               |
| ------------- | ---------------------- | ------------------------------------- |
| `incremental` | `true`                 | Faster subsequent builds              |
| `jsx`         | `preserve`             | Let Next.js handle JSX transformation |
| `plugins`     | `[{ "name": "next" }]` | Next.js TypeScript plugin             |

## API Reference

### base.json

```json
{
  "compilerOptions": {
    "allowJs": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ESNext"
  }
}
```

### library.json

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ESNext"]
  }
}
```

### react.json

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

### next.json

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

## Compatibility

| Technology | Minimum Version | Notes                                |
| ---------- | --------------- | ------------------------------------ |
| TypeScript | 5.0.0           | Required                             |
| Node.js    | 24.0.0          | Required                             |
| React      | 18.0.0+         | When using `react.json`              |
| Next.js    | 14.0.0+         | When using `next.json`               |
| Vite       | 5.0.0+          | Works with bundler module resolution |
| Turbopack  | Any             | Works with bundler module resolution |
| esbuild    | 0.19+           | Works with bundler module resolution |

## Troubleshooting

### Cannot find module or type declarations

When extending from `@codefast/typescript-config`, make sure the package is installed as a dev dependency and your `tsconfig.json` is at the project root:

```bash
pnpm add -D @codefast/typescript-config
```

### Conflicting `lib` settings

If you need DOM types in a library project, override the `lib` option in your local `tsconfig.json`:

```json
{
  "extends": "@codefast/typescript-config/library.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ESNext"]
  }
}
```

### Internal aliases not resolving

Prefer Node subpath imports via `package.json#imports` for internal aliases:

```json
{
  "type": "module",
  "imports": {
    "#*": ["./src/*"]
  }
}
```

### Incremental build issues with Next.js

If you encounter stale type errors, delete the `.tsbuildinfo` file and rebuild:

```bash
rm -f tsconfig.tsbuildinfo
pnpm build
```

## Contributing

We welcome contributions! Please see the [contributing guide](../../README.md#contributing) in the root of this repository for detailed instructions.

For package-specific development:

```bash
# Build all packages
pnpm build:packages

# Lint and format (from repo root)
pnpm lint
pnpm format
```

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a complete list of changes and version history.
