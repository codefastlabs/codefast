# CodeFast Project Guidelines

## Project Overview

CodeFast is a comprehensive UI component library built with modern web technologies. It's designed as a monorepo containing reusable React components, utilities, and applications.

### Key Technologies

- **React 19** - Component framework
- **TypeScript 5** - Type safety and development experience
- **Next.js 15** - Application framework
- **TailwindCSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Zod 4** - Schema validation

### Project Objectives

- **Reusability**: Provide versatile UI components for multiple projects
- **Flexible Customization**: Easy style overrides using Tailwind Variants
- **High Performance**: Optimized for speed and minimal resource usage
- **Clear Codebase**: Modern, maintainable structure

## Project Structure

This is a **pnpm monorepo** with the following structure:

```
codefast/
├── apps/                    # Applications
│   └── docs/               # Documentation site
├── packages/               # Reusable packages
│   ├── ui/                # Main UI component library
│   ├── progress-circle/   # Progress circle component
│   ├── input-number/      # Number input component
│   ├── image-loader/      # Image loading utilities
│   └── ...               # Other packages
├── docs/                  # Project documentation
│   └── reports/          # Automated reports
├── scripts/              # Build and utility scripts
└── benchmarks/           # Performance benchmarks
```

### Package Management

- **Package Manager**: pnpm (version 10.13.1+)
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
pnpm lint                      # Run ESLint (automatically builds packages first)
pnpm lint:fix                  # Fix linting issues (automatically builds packages first)
pnpm format                    # Format code with Prettier
pnpm format:check              # Check formatting
pnpm type-check                # TypeScript type checking (automatically builds packages first)
```

**Note**: The `lint`, `lint:fix`, and `type-check` commands now automatically build packages before running to ensure quality checks work on the latest code.

## Testing Guidelines

### Running Tests

- **All tests**: `pnpm test`
- **Watch mode**: `pnpm test:watch`
- **Coverage**: `pnpm test:coverage`
- **CI Coverage**: `pnpm test:coverage:ci`

### Testing Requirements

- **Always run tests** when modifying existing functionality
- **Write tests** for new components and utilities
- **Maintain coverage** - check coverage reports in `packages/*/coverage/`
- **Test files** should be co-located with source files using `.test.ts` or `.test.tsx` extensions

### Test Framework

- **Jest** for unit testing
- **Testing Library** for React component testing
- Each package has its own `jest.config.ts`

## Build Process

### Build Requirements

- **Always build packages** before submitting changes: `pnpm build:packages`
- **Clean builds** when needed: `pnpm clean && pnpm build`
- **Verify builds** work across all packages

### Build Outputs

- **Packages**: Built to `dist/` directories
- **Apps**: Built to `.next/` directories
- **Types**: Generated TypeScript declarations included

## Code Style Guidelines

### TypeScript

- **Strict mode** enabled
- **Type safety** is mandatory - no `any` types without justification
- **Interfaces** preferred over type aliases for object shapes
- **Export types** explicitly when used across packages

### React Components

- **Functional components** with hooks
- **TypeScript interfaces** for props
- **Forward refs** for component composition
- **Radix UI primitives** as base for complex components

### Styling

- **TailwindCSS** for styling
- **Tailwind Variants** for component variants
- **CSS-in-JS** avoided in favor of utility classes
- **Responsive design** considerations

### File Organization

- **Co-location** of related files (component + test + stories)
- **Index files** for clean imports
- **Consistent naming**: PascalCase for components, camelCase for utilities

### Git Workflow

- **Conventional commits** enforced via commitlint
- **Pre-commit hooks** run linting and formatting
- **Changesets** for version management

## Package Development

### Creating New Packages

1. Follow existing package structure in `packages/`
2. Include `package.json`, `tsconfig.json`, `jest.config.ts`
3. Add appropriate build scripts
4. Include README.md and CHANGELOG.md
5. Add to workspace dependencies as needed

### Package Dependencies

- **Peer dependencies** for React, TypeScript
- **Dev dependencies** for build tools
- **Workspace dependencies** using `workspace:*` protocol

## Documentation

### Requirements

- **README.md** for each package
- **CHANGELOG.md** for version history
- **JSDoc comments** for public APIs
- **Storybook stories** for UI components (when applicable)

### Documentation Site

- Located in `apps/docs`
- Built with Next.js
- Deployed automatically via Vercel

## Junie-Specific Instructions

When working on this project:

1. **Always run tests** after making changes: `pnpm test`
2. **Run quality checks** (packages are built automatically): `pnpm lint`, `pnpm type-check`
3. **Check formatting** and fix if needed: `pnpm format`
4. **Build packages explicitly** when needed: `pnpm build:packages`
5. **Test affected packages** individually when making targeted changes
6. **Update documentation** when adding new features or changing APIs
7. **Follow existing patterns** in the codebase for consistency
8. **Use workspace dependencies** (`workspace:*`) for internal package references

**Note**: The development workflow now automatically builds packages before running `lint`, `lint:fix`, and `type-check` commands, ensuring quality checks always work on the latest code.
