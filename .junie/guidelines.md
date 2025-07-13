# Project Guidelines

This document provides essential development guidelines for the CodeFast monorepo project.

## Project Structure

This is a **monorepo** managed with **pnpm** and **Turbo** containing:

```
├── apps/                    # Applications
│   └── docs/               # Documentation site
├── packages/               # Reusable packages
│   ├── checkbox-group/     # UI component
│   ├── eslint-config/      # ESLint configuration
│   ├── hooks/              # React hooks
│   ├── input/              # UI component
│   ├── input-number/       # UI component
│   ├── progress-circle/    # UI component
│   ├── typescript-config/  # TypeScript configuration
│   └── ui/                 # Core UI components
├── benchmarks/             # Performance benchmarks
└── docs/                   # Additional documentation
```

**Workspace Configuration**: Defined in `pnpm-workspace.yaml` with packages in `apps/*`, `packages/**`, and `benchmarks/**`.

## Build/Configuration Instructions

### Prerequisites
- **Node.js**: >= 18.0.0
- **Package Manager**: pnpm 10.12.4 (specified in `packageManager` field)

### Initial Setup
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build:packages

# Build everything
pnpm build
```

### Build System
- **Build Tool**: [rslib](https://github.com/web-infra-dev/rslib) for package building
- **Task Runner**: Turbo for orchestrating builds across the monorepo
- **Output**: Dual ESM/CJS builds with TypeScript declarations
- **Target**: Node.js environment with ES2021 syntax

### Key Scripts
```bash
# Development
pnpm dev                    # Start development mode
pnpm dev:docs              # Start docs development

# Building
pnpm build                 # Build all packages and apps
pnpm build:packages        # Build only packages
pnpm build:docs           # Build only docs

# Maintenance
pnpm clean                 # Clean build artifacts
pnpm clean:cache          # Clean pnpm store and turbo cache
pnpm reinstall            # Clean reinstall all dependencies
```

## Testing Information

### Testing Framework
- **Framework**: Jest with @swc/jest for fast TypeScript compilation
- **Environment**: Node.js
- **Coverage**: V8 provider
- **Setup**: Each package has individual `jest.config.ts` and optional `jest.setup.ts`

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
cd packages/[package-name]
pnpm test
```

### Adding New Tests
1. Create test files with `.test.ts` or `.spec.ts` extension
2. Place tests alongside source files in `src/` directory
3. Import test utilities from `@jest/globals`:
   ```typescript
   import { describe, expect, it } from "@jest/globals";
   ```

### Test Example
```typescript
import { describe, expect, it } from "@jest/globals";

describe("Feature Name", () => {
  it("should demonstrate basic functionality", () => {
    const result = someFunction();
    expect(result).toBe(expectedValue);
  });

  it("should handle edge cases", () => {
    const testArray = ["item1", "item2"];
    expect(Array.isArray(testArray)).toBe(true);
    expect(testArray).toHaveLength(2);
  });
});
```

### Jest Configuration Highlights
- **Transform**: @swc/jest for TypeScript compilation
- **Module Resolution**: `@/` alias maps to `src/`
- **Coverage**: Excludes test files and type definitions
- **ESM Support**: Configured for modern JavaScript modules

## Additional Development Information

### Code Style & Linting
- **Linter**: ESLint 9.x with flat config
- **Formatter**: Prettier with plugins for package.json and Tailwind CSS
- **Pre-commit**: lint-staged with simple-git-hooks

### ESLint Plugin Type Definitions
In the `packages/eslint-config` directory, custom type definitions are maintained for ESLint plugins that don't yet support TypeScript natively. These are defined in `packages/eslint-config/src/types.d.ts`:

- **@next/eslint-plugin-next**: Type definitions for Next.js ESLint plugin
- **eslint-plugin-only-warn**: Type definitions for the only-warn plugin
- **eslint-config-prettier**: Type definitions for Prettier ESLint config
- **eslint-plugin-turbo**: Type definitions for Turbo ESLint plugin
- **eslint-plugin-jsx-a11y**: Type definitions for JSX accessibility plugin

**Important**: If a new `eslint-plugin-*` is added and it does not yet support TypeScript, define its types in the `packages/eslint-config/src/types.d.ts` file. Conversely, if the `eslint-plugin-*` already supports TypeScript, remove any custom type definitions for it.

### Code Style Commands
```bash
pnpm lint              # Lint all packages
pnpm lint:fix          # Auto-fix linting issues
pnpm format            # Format code with Prettier
pnpm format:check      # Check formatting without changes
```

### Version Management
- **Tool**: Changesets for version management and changelog generation
- **Workflow**: Create changesets for changes, then publish releases

### TypeScript Configuration
- **Base Config**: Shared TypeScript configuration in `packages/typescript-config`
- **Build Config**: Each package has `tsconfig.build.json` for builds
- **Type Checking**: `pnpm type-check` runs TypeScript compiler without emitting

### Development Workflow
1. **Always run tests** before submitting changes: `pnpm test`
2. **Build packages** to ensure no build errors: `pnpm build:packages`
3. **Check linting and formatting**: `pnpm lint && pnpm format:check`
4. **Type check**: `pnpm type-check`

### Package Development
- Each package is independently buildable and testable
- Use `rslib build --watch` for development builds
- Follow the existing patterns for Jest configuration and testing
- Ensure dual ESM/CJS compatibility in package exports

### Debugging Tips
- Use `pnpm workspace:list` to see all workspace packages
- Check `turbo.json` for task dependencies and caching rules
- Individual package logs: `turbo run build --filter=package-name`
- Clear caches if builds behave unexpectedly: `pnpm clean:cache`
