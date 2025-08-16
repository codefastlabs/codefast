# CodeFast Development Guidelines

## Project Overview

CodeFast is a monorepo containing a comprehensive UI component library and documentation site built with modern web technologies. The project uses pnpm workspaces, Turbo for build orchestration, and follows strict quality standards.

## Build & Configuration Instructions

### Prerequisites
- **Node.js**: >=20.0.0
- **Package Manager**: pnpm@10.14.0
- **OS**: macOS, Linux, or Windows

### Initial Setup
```bash
# Install dependencies
pnpm deps:install

# Build all packages
pnpm build:packages

# Build documentation site
pnpm build:docs
```

### Development Workflow
```bash
# Start development mode for all packages
pnpm dev

# Start only documentation site
pnpm dev:docs

# Build specific packages
pnpm build:packages

# Clean build artifacts
pnpm clean
```

### Key Build Commands
- `pnpm build` - Build all packages and apps
- `pnpm build:packages` - Build only the component packages
- `pnpm build:docs` - Build the documentation site
- `pnpm dev` - Start development mode for all packages
- `pnpm dev:docs` - Start development mode for documentation only

## Testing Information

### Test Configuration
The project uses Jest with the following configuration:
- **Test Environment**: jsdom (for React components)
- **Coverage Provider**: v8
- **Transform**: @swc/jest for fast TypeScript/JSX transformation
- **Setup**: jest-dom and jest-axe for DOM testing and accessibility testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for specific package
cd packages/ui && pnpm test

# Run specific test file
pnpm test -- button.test.tsx
```

### Test File Structure
Tests should be placed in `__tests__` directories alongside the components:
```
src/components/button/
├── button.tsx
├── button.variants.ts
├── index.ts
└── __tests__/
    └── button.test.tsx
```

### Test Patterns
- Use `@testing-library/react` for component rendering and interaction
- Use `jest-axe` for accessibility testing
- Import test utilities directly (no need for `jest/globals`)
- Use `test()` instead of `it()` for test cases
- Follow the pattern: `describe` → `test` → assertions

### Example Test Structure
```tsx
import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";

import { ComponentName } from "../component-name";

describe("ComponentName", () => {
  test("renders with default props", () => {
    render(<ComponentName>Content</ComponentName>);
    const element = screen.getByRole("button", { name: "Content" });
    expect(element).toBeInTheDocument();
  });

  test("should not have accessibility violations", async () => {
    const { container } = render(<ComponentName>Content</ComponentName>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Testing Best Practices
1. **Accessibility Testing**: Always include axe tests for components
2. **User Interaction**: Use `@testing-library/user-event` for simulating user actions
3. **Component Props**: Test all variant props and their effects
4. **Edge Cases**: Test disabled states, loading states, and error conditions
5. **DOM Structure**: Verify correct HTML attributes and data attributes

## Development Information

### Code Style & Standards
- **ESLint**: Uses custom `@codefast/eslint-config` with React app preset
- **Prettier**: Automatic code formatting with Tailwind CSS plugin
- **TypeScript**: Strict type checking with custom base configuration
- **Commit Hooks**: Uses `simple-git-hooks` with `lint-staged`

### Component Architecture
- **Component Structure**: Each component has its own directory with variants, tests, and index
- **Variant System**: Uses `tailwind-variants` for component styling variants
- **Utility Functions**: Centralized utilities in `src/lib/utils.ts`
- **Export Pattern**: Clean barrel exports through index files

### Styling System
- **Tailwind CSS**: v4 with custom configuration
- **CSS-in-JS**: Uses `tailwind-variants` for component variants
- **Utility Classes**: Leverages `clsx` and `tailwind-merge` for class management
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

### Package Structure
```
packages/
├── ui/                    # Main UI component library
├── hooks/                 # Custom React hooks
├── image-loader/          # Image loading utilities
├── input/                 # Input components
├── input-number/          # Number input components
├── progress-circle/       # Progress indicator components
├── checkbox-group/        # Checkbox group components
├── eslint-config/         # Shared ESLint configuration
├── typescript-config/     # Shared TypeScript configuration
└── tailwind-variants/     # Tailwind variants utilities
```

### Build System
- **RSLib**: Used for building component packages with ESM/CJS dual output
- **Turbo**: Monorepo build orchestration with caching
- **Next.js**: Documentation site with App Router
- **TypeScript**: Strict configuration with path mapping

### Quality Assurance
- **Linting**: ESLint with React, TypeScript, and accessibility rules
- **Type Checking**: TypeScript compilation with strict settings
- **Testing**: Jest with React Testing Library and accessibility testing
- **Formatting**: Prettier with Tailwind CSS plugin
- **Pre-commit**: Automatic linting and formatting on commit

### Development Workflow
1. **Feature Development**: Create feature branch from main
2. **Component Development**: Follow the established component structure
3. **Testing**: Write comprehensive tests including accessibility
4. **Linting**: Ensure code passes ESLint and Prettier
5. **Type Checking**: Verify TypeScript compilation
6. **Documentation**: Update component documentation and examples
7. **Pull Request**: Submit PR with comprehensive description

### Common Issues & Solutions
- **Test Import Errors**: Use `test()` instead of `it()`, no need for `jest/globals`
- **Build Failures**: Run `pnpm clean` to clear build artifacts
- **Type Errors**: Ensure proper TypeScript configuration and imports
- **Styling Issues**: Check Tailwind CSS configuration and variant definitions

### Performance Considerations
- **Bundle Size**: Use tree-shaking and code splitting
- **Component Optimization**: Implement React.memo where appropriate
- **CSS Optimization**: Leverage Tailwind's purge and optimization features
- **Testing Performance**: Use Jest's watch mode for faster development cycles

### Deployment
- **Documentation**: Deployed via Vercel with preview deployments
- **Packages**: Published to npm with changeset versioning
- **CI/CD**: Automated testing and deployment pipelines
- **Versioning**: Semantic versioning with conventional commits

This guide should provide all necessary information for developers to work effectively with the CodeFast project. For additional questions, refer to the project documentation or create an issue in the repository.
