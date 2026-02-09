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
- **Bundler Module Resolution**: Optimized for modern bundlers
- **JavaScript Support**: Allows `.js` files alongside TypeScript
- **JSON Support**: Resolve JSON modules
- **Isolated Modules**: Transpile each file separately
- **No Emit**: Lets the bundler handle output (sets `noEmit: true`)

### Library Configuration Features

- **ESNext Only**: Overrides lib to `["ESNext"]` only (no DOM libs)
- **Inherits Base**: All other settings inherited from base configuration

### React Configuration Features

- **Modern JSX Transform**: Uses `react-jsx` transform
- **DOM Support**: Full DOM and DOM.Iterable libs (inherited from base)

### Next.js Configuration Features

- **Incremental Compilation**: Faster subsequent builds
- **JSX Preserve**: Let Next.js handle JSX transform
- **Next.js Plugin**: TypeScript plugin support

## API Reference

### Configuration Files

#### `base.json`

Base configuration with essential compiler options:

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

#### `library.json`

Library-specific configuration extending base (overrides lib to ESNext only):

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ESNext"]
  }
}
```

#### `react.json`

React-specific configuration (adds JSX support):

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

#### `next.json`

Next.js-specific configuration (incremental builds, JSX preserve, Next.js plugin):

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
