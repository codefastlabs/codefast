# Instructions for AI Assistant's Responses

## Project Overview

CodeFast is a comprehensive UI component library built as a monorepo with modern web technologies. It provides reusable React components, utilities, and applications designed for high performance, flexibility, and maintainability.

### Key Technologies

- **React 19** - Component framework with latest features
- **TypeScript 5** - Type safety and enhanced development experience
- **Next.js 15** - Application framework for the documentation site
- **TailwindCSS 4** - Utility-first CSS framework with latest features
- **Radix UI** - Accessible component primitives as foundation
- **Zod 4** - Schema validation and type inference
- **Jest 30** - Testing framework with modern features
- **SWC** - Fast TypeScript/JavaScript compiler for builds and tests
- **Turbo** - Monorepo orchestration and caching
- **pnpm** - Fast, disk space efficient package manager

### Project Objectives

- **Reusability**: Provide versatile UI components for multiple projects
- **Flexible Customization**: Easy style overrides using Tailwind Variants
- **High Performance**: Optimized for speed and minimal resource usage
- **Clear Codebase**: Modern, maintainable structure with TypeScript
- **Comprehensive Testing**: Ensuring reliability and stability across all packages

## Project Structure

This is a **pnpm monorepo** with the following structure:

```
codefast/
├── apps/                    # Applications
│   └── docs/               # Documentation site (Next.js)
├── packages/               # Reusable packages
│   ├── ui/                # Main UI component library
│   ├── progress-circle/   # Progress circle component
│   ├── input-number/      # Number input component
│   ├── input/             # Input component
│   ├── checkbox-group/    # Checkbox group component
│   ├── hooks/             # React hooks utilities
│   ├── image-loader/      # Image loading utilities
│   ├── tailwind-variants/ # Tailwind variants utilities
│   ├── eslint-config/     # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── docs/                  # Project documentation
│   ├── architecture/      # Architecture documentation
│   └── ai-assistant-instructions.md # This file
├── scripts/              # Build and utility scripts
└── benchmarks/           # Performance benchmarks
```

### Package Management

- **Package Manager**: pnpm (version 10.14.0+)
- **Node.js**: Requires version 20.0.0+
- **Build Tool**: Turbo for monorepo orchestration
- **Workspace**: Defined in `pnpm-workspace.yaml`

## Development Workflow

### Installation and Setup

```bash
pnpm install                    # Install dependencies
pnpm build:packages            # Build all packages
```

### Development Commands

```bash
pnpm dev                       # Start development servers
pnpm dev:docs                  # Start docs app only
pnpm build                     # Build all packages and apps
pnpm build:packages            # Build packages only
pnpm build:docs                # Build docs only
```

### Code Quality

```bash
pnpm lint                      # Run ESLint across all packages
pnpm lint:fix                  # Fix linting issues automatically
pnpm format                    # Format code with Prettier
pnpm format:check              # Check formatting without changes
pnpm type-check                # TypeScript type checking
```

## Testing Guidelines

### Running Tests

- **All tests**: `pnpm test`
- **Watch mode**: `pnpm test:watch`
- **Coverage**: `pnpm test:coverage`
- **CI Coverage**: `pnpm test:coverage:ci`
- **Package-specific tests**: `cd packages/<package-name> && pnpm test`

### Testing Requirements

- **Always run tests** when modifying existing functionality
- **Write tests** for new components and utilities
- **Maintain coverage** - check coverage reports in `packages/*/coverage/`
- **Test files** should be co-located with source files using `.test.ts` or `.test.tsx` extensions

### Test Framework

- **Jest 30** for unit testing with modern features
- **Testing Library** for React component testing
- **SWC** for fast TypeScript compilation in tests
- **jest-axe** for accessibility testing
- Each package has its own `jest.config.ts`

### Test Configuration

Each package contains its own Jest configuration. Example configuration:

```typescript
// Example jest.config.ts
const config: Config = {
  coverageProvider: "v8",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testEnvironment: "jsdom", // for React components
  testMatch: ["**/?(*.)+(test|spec|e2e).[jt]s?(x)"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { /* SWC config */ }],
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  passWithNoTests: true,
  verbose: true,
};
```

### Writing Tests

#### Example: Testing React Components

```typescript
// Example Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(React.createElement(Button, null, 'Click me'));
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn();
    render(React.createElement(Button, { onClick }, 'Click me'));
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Example: Testing Console Output

```typescript
// src/index.test.ts
describe('CLI output', () => {
  it('should log message to console', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    consoleSpy.mockClear();
    
    jest.isolateModules(() => {
      require('./index');
    });
    
    expect(consoleSpy).toHaveBeenCalledWith('Expected message');
    consoleSpy.mockRestore();
  });
});
```

## Build Process

### Build Requirements

- **Always build packages** before submitting changes: `pnpm build:packages`
- **Clean builds** when needed: `pnpm clean && pnpm build`
- **Verify builds** work across all packages

### Build Configuration

Each package uses **rslib** (via `@rslib/core`) for building, which provides:
- TypeScript compilation with SWC
- Dual ESM/CJS output formats
- Type declaration generation
- Source maps
- Watch mode for development

Example package.json build configuration:
```json
{
  "exports": {
    ".": {
      "import": {
        "default": "./dist/esm/index.js",
        "types": "./dist/esm/index.d.ts"
      },
      "require": {
        "default": "./dist/cjs/index.cjs",
        "types": "./dist/cjs/index.d.cts"
      }
    }
  },
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.js",
  "types": "./dist/esm/index.d.ts",
  "scripts": {
    "build": "rslib build",
    "clean": "rm -rf dist",
    "dev": "rslib build --watch"
  }
}
```

### Build Outputs

- **Packages**: Built to `dist/` directories with ESM and CJS formats
- **Apps**: Built to `.next/` directories
- **Types**: Generated TypeScript declarations included

## Code Style Guidelines

### TypeScript

- **Strict mode** enabled across all packages
- **Type safety** is mandatory - avoid `any` types without justification
- **Interfaces** preferred over type aliases for object shapes
- **Export types** explicitly when used across packages
- **Peer dependencies** for React and TypeScript types

### React Components

- **Functional components** with hooks (React 19 features)
- **TypeScript interfaces** for props with proper typing
- **Forward refs** for component composition
- **Radix UI primitives** as base for complex components
- **Accessibility** considerations with proper ARIA attributes

### Styling

- **TailwindCSS 4** for styling with latest features
- **Tailwind Variants** for component variants and conditional styling
- **CSS-in-JS** avoided in favor of utility classes
- **Responsive design** considerations for all components
- **Dark mode** support using next-themes

### File Organization

- **Co-location** of related files (component + test + stories)
- **Index files** for clean imports and exports
- **Consistent naming**: PascalCase for components, camelCase for utilities
- **Workspace dependencies** using `workspace:*` protocol

## Package Development

### Creating New Packages

1. Follow existing package structure in `packages/`
2. Include `package.json`, `tsconfig.json`, `jest.config.ts`
3. Add appropriate build scripts using rslib
4. Include README.md and CHANGELOG.md
5. Add to workspace dependencies as needed
6. Use workspace protocol for internal dependencies

### Package Dependencies

- **Peer dependencies** for React 19, TypeScript 5
- **Dev dependencies** for build tools (rslib, Jest, ESLint)
- **Workspace dependencies** using `workspace:*` protocol
- **Radix UI** components as foundation for UI packages

### Package Structure Example

```
packages/example-package/
├── src/
│   ├── index.ts          # Main export
│   ├── component.tsx     # Component implementation
│   └── component.test.tsx # Tests
├── dist/                 # Build output (generated)
├── coverage/             # Test coverage (generated)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript config
├── jest.config.ts        # Jest configuration
├── README.md             # Package documentation
└── CHANGELOG.md          # Version history
```

## AI Assistant Specific Instructions

When working on this project as an AI assistant:

### Development Workflow

1. **Always run tests** after making changes: `pnpm test`
2. **Run quality checks**: `pnpm lint`, `pnpm type-check`
3. **Check formatting**: `pnpm format:check` and fix with `pnpm format`
4. **Build packages**: `pnpm build:packages` before submitting changes
5. **Test affected packages** individually when making targeted changes
6. **Update documentation** when adding new features or changing APIs

### Code Quality Standards

1. **Follow existing patterns** in the codebase for consistency
2. **Use TypeScript strictly** - no `any` types without justification
3. **Write comprehensive tests** for new functionality
4. **Maintain accessibility** standards in UI components
5. **Document public APIs** with JSDoc comments
6. **Use workspace dependencies** (`workspace:*`) for internal packages

### Common Tasks

#### Adding a New Component

1. Create component in appropriate package (`packages/ui/src/components/`)
2. Write TypeScript interfaces for props
3. Implement component using Radix UI primitives when applicable
4. Add comprehensive tests including accessibility tests
5. Export component from package index
6. Update documentation

#### Modifying Existing Components

1. Run existing tests first: `cd packages/<package> && pnpm test`
2. Make changes while maintaining backward compatibility
3. Update tests to cover new functionality
4. Run tests again to ensure nothing breaks
5. Update TypeScript types if needed

#### Debugging Issues

1. **Build issues**: Check TypeScript errors with `pnpm type-check`
2. **Test failures**: Run tests in isolation and check for environment issues
3. **Module resolution**: Ensure packages are built and exports are correct
4. **Dependency issues**: Check workspace dependencies and peer dependencies

### Best Practices

1. **Never run development servers** (`pnpm dev`, `pnpm dev:docs`) as they are watch processes
2. **Always build before testing** changes across packages
3. **Use Turbo caching** - it speeds up builds and tests significantly
4. **Check coverage reports** to ensure adequate test coverage
5. **Follow conventional commits** for version management
6. **Update changelogs** when making significant changes

### Error Handling

- **Build errors**: Usually TypeScript or dependency issues
- **Test errors**: Check for proper mocking and environment setup
- **Lint errors**: Use `pnpm lint:fix` to auto-fix when possible
- **Type errors**: Ensure proper TypeScript configuration and exports

### Performance Considerations

- **Bundle size**: Monitor with bundlephobia integration
- **Tree shaking**: Ensure proper ESM exports for optimal bundling
- **Peer dependencies**: Keep React and TypeScript as peer deps
- **Build optimization**: Use SWC for fast compilation

## Documentation Requirements

### Package Documentation

- **README.md** for each package with usage examples
- **CHANGELOG.md** for version history using changesets
- **JSDoc comments** for public APIs and complex functions
- **TypeScript types** serve as inline documentation

### Code Documentation

- **Component props** should be well-typed with descriptions
- **Complex logic** should have explanatory comments
- **Public APIs** must have JSDoc documentation
- **Examples** in documentation should be tested

## Version Management

- **Changesets** for version management and changelog generation
- **Conventional commits** enforced via commitlint
- **Canary releases** supported for pre-release testing
- **Semantic versioning** followed strictly

This document serves as a comprehensive guide for AI assistants working on the CodeFast project. Always refer to this document when making changes to ensure consistency and quality across the codebase.
