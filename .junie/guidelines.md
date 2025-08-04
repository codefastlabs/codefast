# CodeFast Monorepo Development Guidelines

## Project Overview

This is a TypeScript monorepo using pnpm workspaces with Turbo for build orchestration. The project follows modern development practices with comprehensive tooling for code quality, testing, and deployment.

**Key Technologies:**
- Node.js ≥20.0.0
- pnpm 10.14.0 (required package manager)
- TypeScript with ES modules
- Turbo for monorepo build orchestration
- rslib for library building
- Jest with SWC for testing

## Build/Configuration Instructions

### Initial Setup
```bash
# Install dependencies (use pnpm, not npm or yarn)
pnpm install

# Clean and rebuild all packages
pnpm clean
pnpm build:packages
```

### Workspace Structure
The monorepo is organized into:
- `apps/*` - Application packages (e.g., docs)
- `packages/**` - Library packages (nested structure supported)
- `benchmarks/**` - Performance benchmarks

### Building Packages

#### Individual Package Build
```bash
# Build specific package
cd packages/[package-name]
pnpm build

# Watch mode for development
pnpm dev
```

#### Monorepo-wide Builds
```bash
# Build all packages
pnpm build:packages

# Build docs and dependencies
pnpm build:docs

# Build everything
pnpm build
```

### Library Build Configuration (rslib)
Packages use rslib with dual ESM/CJS output:
- **Bundle-free builds** - Preserves individual file structure
- **Dual format** - ESM (`dist/esm/`) and CJS (`dist/cjs/`) with TypeScript declarations
- **Watch mode optimization** - No cleanup/minification during development
- **Node.js target** with automatic test file exclusion

Example rslib config pattern:
```typescript
export default defineConfig({
  lib: [
    { bundle: false, dts: true, format: "esm", output: { distPath: { root: "./dist/esm" } } },
    { bundle: false, dts: true, format: "cjs", output: { distPath: { root: "./dist/cjs" } } }
  ],
  source: {
    entry: { index: ["./src/**/*.{ts,tsx}", "!**/*.{test,spec,e2e,story,stories}.{ts,tsx}"] },
    tsconfigPath: "./tsconfig.build.json"
  }
});
```

### Development Scripts
```bash
# Development with hot reload (11 concurrent processes)
pnpm dev

# Lint with timing metrics
pnpm lint
pnpm lint:fix

# Type checking
pnpm type-check

# Code formatting
pnpm format
pnpm format:check
```

## Testing Information

### Jest Configuration
The project uses Jest with SWC for fast TypeScript transformation:
- **V8 coverage provider** for performance
- **ESM support** with proper extension handling
- **Module path mapping** (`@/...` → `src/...`)
- **SWC transformation** with decorator support
- **Watch mode optimizations**

### Running Tests

#### Basic Test Commands
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage reports
pnpm test:coverage

# CI coverage (with coverage outputs)
pnpm test:coverage:ci
```

#### Package-specific Testing
```bash
cd packages/[package-name]
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Test File Patterns
Jest automatically detects test files matching:
- `**/?(*.)+(test|spec|e2e).[jt]s?(x)`

### Adding New Tests
1. Create test files alongside source files with `.test.ts` or `.spec.ts` extension
2. Use Jest's `describe` and `it` blocks
3. Import functions to test using relative paths or module mapping

#### Example Test Structure
```typescript
import { functionToTest } from "./module";

describe("functionToTest", () => {
  it("should handle basic input", () => {
    const result = functionToTest("input");
    expect(result).toBe("expected");
  });

  it("should handle edge cases", () => {
    const result = functionToTest("");
    expect(result).toBe("");
  });
});
```

### Working Test Example
A working test example has been created in `packages/tailwind-variants/src/cn.test.ts` that demonstrates:
- Testing utility functions
- Handling external dependencies (tailwind-merge)
- Class merging behavior validation
- Configuration handling

To run this example:
```bash
cd packages/tailwind-variants
pnpm test
```

## Development Information

### Code Style & Linting
- **ESLint 9.x** with flat config format
- **Timing metrics enabled** (`TIMING=1`) for performance monitoring
- **Zero warnings policy** (`--max-warnings 0`)
- **Comprehensive plugin suite**:
  - TypeScript, React, Next.js support
  - Import/export validation
  - Accessibility checking
  - Code style enforcement
  - Turbo monorepo optimizations

### Commit Standards
- **Conventional Commits** with commitlint
- **Automated hooks** via simple-git-hooks
- **Lint-staged** for pre-commit validation

### Package Publishing
- **Changesets** for version management and changelog generation
- **Canary releases** supported
- **Public access** configured for scoped packages (`@codefast/*`)

### Dependency Management
```bash
# Check for outdated dependencies
pnpm deps:outdated

# Update dependencies interactively
pnpm deps:update

# Audit for vulnerabilities
pnpm deps:audit
pnpm deps:audit:fix

# Clean reinstall
pnpm deps:reinstall
```

### Performance Optimization
- **onlyBuiltDependencies** for native modules requiring source builds
- **Turbo caching** with intelligent input/output detection
- **SWC compilation** for fast builds and tests
- **Watch mode optimizations** in both build and test configurations

### Workspace Dependencies
Packages can reference each other using `workspace:*` protocol:
```json
{
  "dependencies": {
    "@codefast/eslint-config": "workspace:*",
    "@codefast/typescript-config": "workspace:*"
  }
}
```

### Key Configuration Files
- `turbo.json` - Build pipeline configuration with caching
- `pnpm-workspace.yaml` - Workspace and dependency configuration
- `jest.config.ts` - Test configuration (per package)
- `rslib.config.ts` - Build configuration (per package)
- `tsconfig.build.json` - Build-specific TypeScript settings
- `lint-staged.config.js` - Pre-commit linting rules

### Debugging Tips
- Use `TIMING=1` with ESLint commands to identify performance bottlenecks
- Run `turbo clean` to clear build cache if experiencing issues
- Use `pnpm store prune` to clean package cache
- Test files are automatically excluded from builds via rslib configuration
- Watch modes (dev/test:watch) automatically disable optimizations for faster iteration

---

*Generated on August 9, 2025 for advanced developers working on the CodeFast monorepo.*
