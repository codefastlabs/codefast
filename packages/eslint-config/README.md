# @codefast/eslint-config

Comprehensive ESLint configuration for TypeScript, React, and Next.js projects with modern linting rules, accessibility checks, and code formatting standards.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/eslint-config.svg)](https://www.npmjs.com/package/@codefast/eslint-config)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/eslint-config.svg)](https://www.npmjs.com/package/@codefast/eslint-config)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Base Configuration](#base-configuration)
  - [React Application](#react-application-configuration)
  - [Next.js Application](#nextjs-application-configuration)
  - [Library](#library-configuration)
  - [Custom Composition](#custom-configuration-with-individual-rules)
- [Configuration Options](#configuration-options)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

## Overview

`@codefast/eslint-config` provides ready-to-use ESLint 9 flat config presets for different project types. It bundles best-practice rules for JavaScript, TypeScript, React, Next.js, accessibility, import sorting, and code style into a single dependency.

**Key features:**

- **Modern JavaScript/TypeScript Support** -- Latest ECMAScript features and TypeScript strict checking.
- **React and Next.js Optimized** -- Comprehensive rules for React applications and Next.js frameworks.
- **Accessibility First** -- Built-in JSX accessibility rules for inclusive web development.
- **Import Management** -- Automatic import sorting and organization.
- **Code Quality** -- Perfectionist rules for consistent code structure.
- **Testing Support** -- Jest-specific rules for test files.
- **Monorepo Ready** -- Turbo and workspace-optimized configurations.
- **Customizable** -- Modular design allows mixing and matching rule sets.

## Installation

```bash
pnpm add -D @codefast/eslint-config
```

Or using npm:

```bash
npm install --save-dev @codefast/eslint-config
```

**Peer dependencies:**

```bash
pnpm add -D eslint
```

**Requirements:**

- Node.js >= 24.0.0 (LTS)
- ESLint >= 9.0.0
- TypeScript >= 5.0.0 (for TypeScript projects)

## Quick Start

```typescript
// eslint.config.ts
import { basePreset } from '@codefast/eslint-config/presets/base';

export default [...basePreset];
```

For React applications:

```typescript
// eslint.config.ts
import { reactPreset } from '@codefast/eslint-config/presets/react';

export default [...reactPreset];
```

## Usage

### Base Configuration

For basic JavaScript/TypeScript projects:

```typescript
import { basePreset } from '@codefast/eslint-config/presets/base';

export default [
  ...basePreset,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    // Add your custom rules here
  },
];
```

### React Application Configuration

For React applications with comprehensive rules and accessibility:

```typescript
import { reactPreset } from '@codefast/eslint-config/presets/react';

export default [
  ...reactPreset,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    settings: {
      react: { version: 'detect' },
    },
  },
];
```

### Next.js Application Configuration

For Next.js applications with framework-specific optimizations:

```typescript
import { nextPreset } from '@codefast/eslint-config/presets/next';

export default [
  ...nextPreset,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    settings: {
      next: { rootDir: true },
    },
  },
];
```

### Library Configuration

For library and NPM package development:

```typescript
import { libraryPreset } from '@codefast/eslint-config/presets/library';

export default [
  ...libraryPreset,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    // Library-specific configurations
  },
];
```

### Custom Configuration with Individual Rules

Compose your own configuration from individual rule sets:

```typescript
import { baseJavaScriptRules } from '@codefast/eslint-config/core/javascript';
import { typescriptRules } from '@codefast/eslint-config/core/typescript';
import { reactRules } from '@codefast/eslint-config/plugins/frameworks/react';
import { importRules } from '@codefast/eslint-config/core/import';
import { composeConfig } from '@codefast/eslint-config/utils/compose-config';

export default composeConfig([
  baseJavaScriptRules,
  typescriptRules,
  reactRules,
  importRules,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Your custom rules
    },
  },
]);
```

## Configuration Options

### Available Presets

| Preset          | Description                          | Use Case                        |
| --------------- | ------------------------------------ | ------------------------------- |
| `basePreset`    | Core JavaScript/TypeScript rules     | Basic projects, utilities       |
| `reactPreset`   | React application with accessibility | React SPAs, component libraries |
| `nextPreset`    | Next.js with SSR/SSG optimizations   | Next.js applications            |
| `libraryPreset` | Library-focused rules                | NPM packages, shared libraries  |

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
| `testEnvironment`    | Testing environment      | Jest, testing utilities              |

### Language Support

| Language   | Support                             |
| ---------- | ----------------------------------- |
| JavaScript | ES2022+ syntax                      |
| TypeScript | Full type checking and strict rules |
| JSX / TSX  | React component syntax              |
| JSON       | JSON file linting                   |
| Markdown   | Code blocks in documentation        |
| CSS        | Basic CSS file linting              |

## API Reference

### basePreset

Base configuration for JavaScript/TypeScript projects.

```typescript
const basePreset: ESLint.Config[];
```

Includes: core JavaScript rules, TypeScript support, import management, code style formatting, perfectionist sorting.

### reactPreset

Complete configuration for React applications.

```typescript
const reactPreset: ESLint.Config[];
```

Includes: all base preset rules, React-specific rules, JSX accessibility checks, React Hooks rules, browser environment.

### nextPreset

Optimized configuration for Next.js applications.

```typescript
const nextPreset: ESLint.Config[];
```

Includes: all React preset rules, Next.js specific rules, SSR/SSG optimizations, image optimization rules.

### libraryPreset

Configuration optimized for library development.

```typescript
const libraryPreset: ESLint.Config[];
```

Includes: base preset rules, library-specific optimizations, Node.js environment, TSDoc documentation rules.

### composeConfig

Utility function for composing custom configurations from individual rule sets.

```typescript
function composeConfig(configs: ESLint.Config[]): ESLint.Config[];
```

| Parameter | Type              | Description                                      |
| --------- | ----------------- | ------------------------------------------------ |
| `configs` | `ESLint.Config[]` | Array of ESLint configuration objects to compose |

**Returns:** Composed `ESLint.Config[]` array.

## Troubleshooting

### "ESLintrc" format not supported

This package uses ESLint 9 [flat config](https://eslint.org/docs/latest/use/configure/configuration-files-new) format. Make sure your config file is named `eslint.config.ts` (or `.js`, `.mjs`) instead of `.eslintrc.*`.

### TypeScript parsing errors

Ensure you have TypeScript installed and the `tsconfig.json` is accessible from your project root:

```bash
pnpm add -D typescript
```

### Conflicting rules with Prettier

The `stylisticRules` handle formatting. If you also use Prettier, the built-in Prettier plugin ensures they do not conflict. No additional configuration is needed.

### Slow linting in large projects

Use the `TIMING=1` environment variable to identify slow rules:

```bash
TIMING=1 pnpm lint
```

Then consider disabling expensive rules for specific file patterns using the `files` and `ignores` options in your config.

## Contributing

We welcome contributions! Please see the [contributing guide](../../README.md#contributing) in the root of this repository for detailed instructions.

For package-specific development:

```bash
# Build the package
pnpm build --filter=@codefast/eslint-config

# Development mode with watch
pnpm dev --filter=@codefast/eslint-config

# Run tests
pnpm test --filter=@codefast/eslint-config

# Test with timing information
TIMING=1 pnpm lint
```

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a complete list of changes and version history.
