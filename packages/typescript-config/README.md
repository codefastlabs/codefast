# TypeScript Config

Shared TypeScript configuration presets for the CodeFast monorepo, providing standardized TypeScript settings for different project types including React applications, Next.js projects, libraries, and base configurations.

![NPM Version](https://img.shields.io/npm/v/@codefast/typescript-config.svg)

## Installation

Install the package via pnpm (recommended):

```bash
pnpm add -D @codefast/typescript-config
```

Or using npm:

```bash
npm install --save-dev @codefast/typescript-config
```

**Requirements**:

- Node.js version 20.0.0 or higher
- TypeScript version 5.0.0 or higher

## Quick Start

Create a `tsconfig.json` file in your project and extend from the appropriate configuration:

```json
{
  "extends": "@codefast/typescript-config/base.json"
}
```

## Usage

### Base Configuration

Basic configuration for all TypeScript projects:

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

For developing libraries and packages:

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
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

## Configurations

### Available Configurations

| Configuration | Description | Use Case |
|---------------|-------------|----------|
| `base.json` | Basic configuration with strict settings | Base for all projects |
| `library.json` | Extends base, adds library-specific options | NPM packages, shared libraries |
| `react.json` | Extends base, adds React JSX support | React components and apps |
| `next.json` | Extends base, optimized for Next.js | Next.js applications |

### Base Configuration Features

- **Strict Type Checking**: Enables all strict options
- **Modern JavaScript**: Targets ESNext with full ESNext lib support
- **Module Resolution**: Node-style resolution with ESNext modules
- **Developer Experience**: Force consistent casing, no unused variables/parameters
- **JSON Support**: Resolve JSON modules
- **Isolated Modules**: Transpile each file separately

### Library Configuration Features

- **Declaration Generation**: Automatically generates `.d.ts` files
- **Source Maps**: Generate source maps for debugging
- **Strip Internal**: Remove internal declarations from output
- **ESNext Only**: Does not include DOM libs

### React Configuration Features

- **Modern JSX Transform**: Uses `react-jsx` transform
- **React Import Source**: Automatically import React when needed
- **DOM Support**: Full DOM and DOM.Iterable libs

### Next.js Configuration Features

- **JavaScript Support**: Allow `.js` files
- **Incremental Compilation**: Faster subsequent builds
- **JSX Preserve**: Let Next.js handle JSX transform
- **Bundler Resolution**: Optimized for bundler
- **No Emit**: Next.js handles compilation
- **Next.js Plugin**: TypeScript plugin support

## API Reference

### Configuration Files

#### `base.json`

Base configuration with essential compiler options:

```typescript
interface BaseConfig {
  compilerOptions: {
    allowSyntheticDefaultImports: true;
    declaration: true;
    esModuleInterop: true;
    forceConsistentCasingInFileNames: true;
    isolatedModules: true;
    lib: ["DOM", "DOM.Iterable", "ESNext"];
    module: "ESNext";
    moduleDetection: "force";
    moduleResolution: "node";
    noEmitOnError: true;
    noFallthroughCasesInSwitch: true;
    noImplicitOverride: true;
    noImplicitReturns: true;
    noUnusedLocals: true;
    noUnusedParameters: true;
    resolveJsonModule: true;
    skipLibCheck: true;
    strict: true;
    target: "ESNext";
    useDefineForClassFields: true;
  };
}
```

#### `library.json`

Library-specific configuration extending base:

```typescript
interface LibraryConfig extends BaseConfig {
  compilerOptions: BaseConfig['compilerOptions'] & {
    declaration: true;
    lib: ["ESNext"];
    sourceMap: true;
    stripInternal: true;
  };
}
```

#### `react.json`

React-specific configuration:

```typescript
interface ReactConfig extends BaseConfig {
  compilerOptions: BaseConfig['compilerOptions'] & {
    jsx: "react-jsx";
    jsxImportSource: "react";
  };
}
```

#### `next.json`

Next.js-specific configuration:

```typescript
interface NextConfig extends BaseConfig {
  compilerOptions: BaseConfig['compilerOptions'] & {
    allowJs: true;
    incremental: true;
    jsx: "preserve";
    moduleResolution: "bundler";
    noEmit: true;
    plugins: [{ name: "next" }];
  };
}
```

## Contributing

We welcome all contributions! To start developing:

### Environment Setup

1. Fork this repository.
2. Clone to your machine: `git clone <your-fork-url>`
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b feature/feature-name`

### Development Workflow

```bash
# Build all packages
pnpm build:packages

# Development mode for typescript-config
pnpm dev --filter=@codefast/typescript-config

# Run tests
pnpm test --filter=@codefast/typescript-config

# Lint and format
pnpm lint:fix
pnpm format
```

5. Commit and submit pull request.

See details at [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more information.

## Contact

- npm: [@codefast/typescript-config](https://www.npmjs.com/package/@codefast/typescript-config)
- GitHub: [codefastlabs/codefast](https://github.com/codefastlabs/codefast)
- Issues: [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- Documentation: [TypeScript Config Docs](https://github.com/codefastlabs/codefast/tree/main/packages/typescript-config)

## Compatibility

This package is compatible with:

- **TypeScript**: 5.0.0+
- **Node.js**: 20.0.0+
- **React**: 18.0.0+ (when using react.json)
- **Next.js**: 14.0.0+ (when using next.json)
