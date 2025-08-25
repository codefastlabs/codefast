# ESLint Config

Comprehensive ESLint configuration for TypeScript, React, and Next.js projects with modern linting rules, accessibility checks, and code formatting standards for monorepo development.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/@codefast/eslint-config.svg)](https://www.npmjs.com/package/@codefast/eslint-config)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10%2B-blue.svg)](https://pnpm.io/)

## Installation

Install the configuration via pnpm (recommended):

```bash
pnpm add -D @codefast/eslint-config
```

Or using npm:

```bash
npm install --save-dev @codefast/eslint-config
```

**Peer Dependencies**:

Make sure you have installed ESLint:

```bash
pnpm add -D eslint
```

**Requirements**:

- Node.js version 20.0.0 or higher
- ESLint version 9.0.0 or higher
- TypeScript version 5.0.0 or higher (for TypeScript projects)

## Quick Start

```typescript
import { basePreset } from "@codefast/eslint-config";

export default [...basePreset];
```

For React applications:

```typescript
import { reactAppPreset } from "@codefast/eslint-config";

export default [...reactAppPreset];
```

## Usage

### Base Configuration

For basic JavaScript/TypeScript projects:

```typescript
import { basePreset } from "@codefast/eslint-config";

export default [
  ...basePreset,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    // Add your custom rules here
  },
];
```

### React Application Configuration

For React applications with comprehensive rules:

```typescript
import { reactAppPreset } from "@codefast/eslint-config";

export default [
  ...reactAppPreset,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
```

### Next.js Application Configuration

For Next.js applications with framework-specific rules:

```typescript
import { nextAppPreset } from "@codefast/eslint-config";

export default [
  ...nextAppPreset,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    settings: {
      next: {
        rootDir: true,
      },
    },
  },
];
```

### Library Configuration

For library packages with optimized rules:

```typescript
import { libraryPreset } from "@codefast/eslint-config";

export default [
  ...libraryPreset,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    // Library-specific configurations
  },
];
```

### Custom Configuration with Individual Rules

For advanced customization, you can compose your own configuration:

```typescript
import {
  baseJavaScriptRules,
  typescriptRules,
  reactRules,
  importRules,
  composeConfig,
} from "@codefast/eslint-config";

export default composeConfig([
  baseJavaScriptRules,
  typescriptRules,
  reactRules,
  importRules,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Your custom rules
    },
  },
]);
```

## Configuration Options

### Available Presets

| Preset           | Description                          | Use Case                        |
| ---------------- | ------------------------------------ | ------------------------------- |
| `basePreset`     | Core JavaScript/TypeScript rules     | Basic projects, utilities       |
| `reactAppPreset` | React application with accessibility | React SPAs, component libraries |
| `nextAppPreset`  | Next.js with SSR/SSG optimizations   | Next.js applications            |
| `libraryPreset`  | Library-focused rules                | NPM packages, shared libraries  |

### Rule Categories

| Category              | Description               | Key Features                            |
| --------------------- | ------------------------- | --------------------------------------- |
| `baseJavaScriptRules` | Core JavaScript linting   | ES6+, best practices, error prevention  |
| `typescriptRules`     | TypeScript-specific rules | Type safety, strict checks              |
| `reactRules`          | React component rules     | Hooks, JSX, component patterns          |
| `importRules`         | Import/export management  | Module organization, dependency sorting |
| `stylisticRules`      | Code formatting rules     | Consistent style, readable code         |
| `perfectionistRules`  | Code organization rules   | Sorting, grouping, structure            |

### Environment Configurations

| Environment          | Description              | Globals                              |
| -------------------- | ------------------------ | ------------------------------------ |
| `browserEnvironment` | Browser-specific globals | `window`, `document`, `localStorage` |
| `nodeEnvironment`    | Node.js environment      | `process`, `global`, `Buffer`        |
| `jestEnvironment`    | Testing environment      | Jest, testing utilities              |

## API Reference

### `basePreset`

Base configuration for JavaScript/TypeScript projects.

```typescript
const basePreset: ESLint.Config[];
```

Includes:

- Core JavaScript rules
- TypeScript support
- Import management
- Code style formatting
- Perfectionist sorting

### `reactAppPreset`

Complete configuration for React applications.

```typescript
const reactAppPreset: ESLint.Config[];
```

Includes:

- All base preset rules
- React-specific rules
- JSX accessibility checks
- React Hooks rules
- Browser environment

### `nextAppPreset`

Optimized configuration for Next.js applications.

```typescript
const nextAppPreset: ESLint.Config[];
```

Includes:

- All React preset rules
- Next.js specific rules
- SSR/SSG optimizations
- Image optimization rules

### `libraryPreset`

Configuration optimized for library development.

```typescript
const libraryPreset: ESLint.Config[];
```

Includes:

- Base preset rules
- Library-specific optimizations
- Node.js environment
- TSDoc documentation rules

### `composeConfig`

Utility function for composing custom configurations.

```typescript
type composeConfig = (configs: ESLint.Config[]) => ESLint.Config[];
```

**Parameters**:

- `configs` - Array of ESLint configuration objects

**Returns**: Composed ESLint configuration array

### Language Support

- **JavaScript**: ES2022+ syntax support
- **TypeScript**: Full type checking and strict rules
- **JSX/TSX**: React component syntax
- **JSON**: JSON file linting
- **Markdown**: Code blocks in documentation
- **CSS**: Basic CSS file linting

## Contributing

We welcome all contributions! To get started with development:

### Environment Setup

1. Fork this repository.
2. Clone to your machine: `git clone <your-fork-url>`
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b feature/feature-name`

### Development Workflow

```bash
# Build the package
pnpm build

# Development mode with watch
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint and format
pnpm lint:fix
```

### Testing Your Changes

Create a test ESLint configuration to verify your changes:

```bash
# Test the configuration
pnpm lint

# Test with timing information
TIMING=1 pnpm lint
```

5. Commit and submit a pull request.

See details at [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Contact

- npm: [@codefast/eslint-config](https://www.npmjs.com/package/@codefast/eslint-config)
- GitHub: [codefastlabs/codefast](https://github.com/codefastlabs/codefast)
- Issues: [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- Documentation: [ESLint Config Docs](https://github.com/codefastlabs/codefast/tree/main/packages/eslint-config)

## Features

This ESLint configuration provides:

- **Modern JavaScript/TypeScript Support**: Latest ECMAScript features and TypeScript strict checking
- **React & Next.js Optimized**: Comprehensive rules for React applications and Next.js frameworks
- **Accessibility First**: Built-in JSX accessibility rules for inclusive web development
- **Import Management**: Automatic import sorting and organization
- **Code Quality**: Perfectionist rules for consistent code structure
- **Testing Support**: Jest-specific rules for test files
- **Monorepo Ready**: Turbo and workspace-optimized configurations
- **Customizable**: Modular design allows mixing and matching rule sets
