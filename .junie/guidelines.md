# Project Guidelines

## Build/Configuration Instructions

### Prerequisites
- **Node.js**: Version ≥20.0.0 (as specified in root package.json)
- **Package Manager**: pnpm@10.14.0 (strictly required)
- **TypeScript**: Version 5.9.2+ (latest version as per standards)

### Monorepo Structure
This is a pnpm workspace monorepo with the following structure:
- `apps/*` - Applications
- `packages/**` - Shared packages and libraries
- `benchmarks/**` - Performance benchmarks

### Initial Setup
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build:packages

# Build everything
pnpm build
```

### Development Workflow
```bash
# Start development mode (all apps/packages)
pnpm dev

# Start development for docs only
pnpm dev:docs

# Clean build artifacts
pnpm clean

# Clean everything including cache
pnpm clean:cache
```

### Build Tools
- **Turbo**: Used for monorepo build orchestration and caching
- **rslib**: Modern Rust-based build tool for packages (replaces traditional bundlers)
- **SWC**: Fast TypeScript/JavaScript transpilation
- **ESM**: All packages use ES modules (`"type": "module"`)

## Testing Information

### Testing Framework
- **Jest**: Primary testing framework with SWC transpilation
- **Environment**: Node.js (default) with jsdom support for UI components
- **Coverage**: V8 coverage provider for accurate reporting

### Test Configuration
Each package has its own `jest.config.ts` with:
- Path mapping support (`@/*` → `src/*`)
- ESM support for TypeScript files
- SWC transformation for fast transpilation
- Test files located in `tests/unit/**/*.test.ts`

### Running Tests

#### Root Level (All Packages)
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests for CI with coverage
pnpm test:coverage:ci
```

#### Package Level
```bash
cd packages/[package-name]

# Run tests for specific package
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test file
npm test -- filename.test.ts
```

### Adding New Tests
1. Create test files in `tests/unit/` directory
2. Use `.test.ts` or `.spec.ts` extension
3. Follow the established patterns:
   ```typescript
   import { functionToTest } from "@/index";

   describe("Feature Name", () => {
     test("should do something specific", () => {
       const result = functionToTest();
       expect(result).toContain("expected-value");
     });
   });
   ```

### Example Test Execution
A simple test demonstrating the process:
```typescript
// tests/unit/demo.test.ts
import { tv } from "@/index";

describe("Demo Test - Simple TV Function", () => {
  test("should create basic variant styles", () => {
    const buttonVariants = tv({
      base: "px-4 py-2 rounded",
      variants: {
        color: {
          primary: "bg-blue-500 text-white",
          secondary: "bg-gray-500 text-white",
        },
      },
      defaultVariants: {
        color: "primary",
      },
    });

    expect(buttonVariants()).toContain("bg-blue-500");
  });
});
```

## Code Style Standards

### TypeScript Standards
Based on project's cursor rules, follow these guidelines:

#### Core Principles
- **Latest TypeScript**: Always use TypeScript 5.9.2+
- **Strict Mode**: Enable `strict: true` with all strict flags
- **ESNext**: Use `"target": "ESNext"` and `"module": "ESNext"`
- **Explicit Types**: Define return types for all functions
- **No Any**: Avoid `any` or `unknown`; use precise types
- **Interfaces First**: Prefer interfaces over type aliases for object types

#### Advanced TypeScript Features
- **Generic Constraints**: Use `T extends SomeType` for type safety
- **Conditional Types**: Leverage `T extends U ? X : Y` patterns
- **Mapped Types**: Use built-in utilities like `Partial<T>`, `Pick<T, K>`
- **Template Literals**: For dynamic string types
- **Type Guards**: Custom predicates with `obj is Type`
- **Discriminated Unions**: Use `kind` or similar discriminant properties
- **Branded Types**: For semantic type distinction

#### ES Module Standards
- **ES Modules Only**: Use `import`/`export`, never CommonJS
- **Named Exports**: Prefer named over default exports
- **Modern Syntax**: Use optional chaining (`?.`), nullish coalescing (`??`)
- **Latest Features**: Leverage ESNext features and modern array methods

### Code Formatting
- **Prettier**: Automatic formatting with project config
- **ESLint**: Linting with workspace shared config (`@codefast/eslint-config`)
- **Lint Staged**: Pre-commit hooks ensure code quality

### Documentation
- **JSDoc**: Required for public APIs and complex types
- **README**: Each package should have comprehensive documentation
- **Changesets**: Use for versioning and changelog generation

## Development Commands Reference

### Quality Assurance
```bash
# Type checking
pnpm check-types

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format
pnpm format:check
```

### Dependency Management
```bash
# Check for outdated packages
pnpm deps:outdated

# Update dependencies interactively
pnpm deps:upgrade

# Audit security
pnpm deps:audit

# Complete reinstall
pnpm deps:reinstall
```

### Release Management
```bash
# Create changeset
pnpm release

# Enter canary mode
pnpm release:canary:enter

# Exit canary mode
pnpm release:canary:exit
```

## Package-Specific Notes

### TypeScript Configuration
- Each package extends `@codefast/typescript-config/react.json`
- Path aliases configured (`@/*` maps to `src/*`)
- Decorator support enabled where needed
- Jest types included for test files

### Build Output
- **CJS**: `dist/index.cjs` for CommonJS compatibility
- **ESM**: `dist/index.js` for modern environments
- **Types**: `dist/index.d.ts` for TypeScript support
- **Dual Export**: Packages support both module systems
