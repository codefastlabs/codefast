# Contributing to CodeFast

Thank you for your interest in contributing to CodeFast! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.0.0 or higher
- **pnpm**: Version 10.16.1 or higher (required package manager)
- **Git**: For version control

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/codefast.git
   cd codefast
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/codefastlabs/codefast.git
   ```

## Development Setup

### Install Dependencies

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build:packages
```

### Verify Installation

```bash
# Run tests to ensure everything works
pnpm test

# Check types
pnpm check-types

# Run linting
pnpm lint
```

## Development Workflow

### Branch Strategy

1. Create a new branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. Make your changes following our [Code Standards](#code-standards)

3. Test your changes:
   ```bash
   # Run tests for specific package
   pnpm test --filter=@codefast/package-name
   
   # Run all tests
   pnpm test
   
   # Check types
   pnpm check-types
   
   # Run linting
   pnpm lint
   ```

### Working with Packages

This is a monorepo with multiple packages. Here's how to work with them:

#### Package Structure

```
codefast/                  # Root monorepo
├── package.json           # Root package.json with workspace scripts
├── pnpm-workspace.yaml    # pnpm workspace configuration
├── turbo.json            # Turbo build configuration
├── commitlint.config.js  # Commit linting configuration
├── prettier.config.js    # Prettier configuration
├── simple-git-hooks.js   # Git hooks configuration
├── CONTRIBUTING.md       # This file
├── LICENSE               # MIT License
├── README.md             # Project README
├── SECURITY.md           # Security policy
├── scripts/              # Utility scripts
│   ├── clean-empty-dirs.sh
│   └── README.md
├── packages/             # All packages
│   ├── ui/               # Main UI components library (@codefast/ui)
│   │   └── src/
│   │       ├── components/    # Component files with co-located variants
│   │       │   ├── button.tsx
│   │       │   ├── alert.tsx
│   │       │   └── ...
│   │       └── index.ts       # Barrel exports
│   ├── hooks/            # React hooks (@codefast/hooks)
│   │   └── src/
│   │       ├── __tests__/     # Co-located tests
│   │       ├── use-*.ts       # Individual hook files
│   │       └── index.ts       # Barrel exports
│   ├── eslint-config/   # ESLint configurations (@codefast/eslint-config)
│   │   └── src/
│   │       ├── core/          # Core ESLint rules
│   │       ├── environments/  # Environment configs
│   │       ├── languages/     # Language-specific rules
│   │       ├── plugins/       # Plugin configurations
│   │       ├── presets/      # Preset configurations
│   │       └── shared/       # Shared utilities
│   ├── typescript-config/    # TypeScript configurations (@codefast/typescript-config)
│   │   ├── base.json         # Base TypeScript config
│   │   ├── react.json        # React-specific config
│   │   ├── next.json         # Next.js-specific config
│   │   └── library.json      # Library-specific config
│   ├── tailwind-variants/   # Tailwind CSS variants (@codefast/tailwind-variants)
│   │   └── src/
│   │       ├── core/          # Core TV functionality
│   │       ├── processing/    # Processing logic
│   │       ├── types/         # Type definitions
│   │       └── utilities/     # Utility functions
│   ├── image-loader/        # Image loading utilities (@codefast/image-loader)
│   │   └── src/
│   │       ├── core/          # Core loader functionality
│   │       ├── loaders/       # Individual CDN loaders
│   │       └── utils/         # Utility functions
│   ├── checkbox-group/      # Checkbox group component (@codefast-ui/checkbox-group)
│   │   └── src/
│   │       ├── __tests__/     # Tests
│   │       ├── checkbox-group.tsx
│   │       └── index.ts
│   ├── input/               # Input component (@codefast-ui/input)
│   │   └── src/
│   │       ├── __tests__/     # Tests
│   │       ├── input.tsx
│   │       └── index.ts
│   ├── input-number/        # Number input component (@codefast-ui/input-number)
│   │   └── src/
│   │       ├── __tests__/     # Tests
│   │       ├── input-number.tsx
│   │       └── index.ts
│   └── progress-circle/     # Progress circle component (@codefast-ui/progress-circle)
│       └── src/
│           ├── __tests__/     # Tests
│           ├── progress-circle.tsx
│           └── index.ts
├── apps/                  # Applications
│   └── docs/              # Documentation site (@app/docs)
│       ├── src/
│       │   ├── app/           # Next.js app directory
│       │   ├── components/    # Documentation components
│       │   ├── lib/           # Utility libraries
│       │   ├── registry/      # Component registry
│       │   └── types/         # Type definitions
│       ├── public/            # Static assets
│       └── next.config.ts     # Next.js configuration
└── benchmarks/            # Performance benchmarks
    └── tailwind-variants/  # Tailwind variants benchmarks
        └── src/
            ├── benchmarks/    # Benchmark files
            └── utils/         # Benchmark utilities
```

#### Development Commands

```bash
# Build specific package
pnpm build --filter=@codefast/package-name

# Build package and its dependencies
pnpm build --filter=@codefast/package-name...

# Development mode for specific package
pnpm dev --filter=@codefast/package-name

# Test specific package
pnpm test --filter=@codefast/package-name

# Lint specific package
pnpm lint --filter=@codefast/package-name

# Run docs development server
pnpm dev:docs
```

## Code Standards

### TypeScript Standards

- **Strict TypeScript**: All code must pass strict type checking
- **No `any` types**: Use explicit types or proper type inference
- **ES Modules**: Use `import`/`export` syntax exclusively
- **Explicit return types**: Functions should have explicit return types when not obvious

### Code Quality Requirements

- **Zero ESLint warnings**: All code must pass linting with 0 warnings
- **100% test success**: All tests must pass
- **Successful builds**: All packages must build without errors
- **Type checking**: All TypeScript compilation must succeed

### Code Style

- **Prettier**: Code formatting is handled automatically by Prettier
- **Naming conventions**:
  - Components: PascalCase (`Button`, `UserProfile`)
  - Hooks: camelCase with 'use' prefix (`useLocalStorage`)
  - Utilities: camelCase (`formatDate`, `validateEmail`)
  - Constants: SCREAMING_SNAKE_CASE (`API_BASE_URL`)
  - Types/Interfaces: PascalCase (`UserProps`, `ApiResponse`)

### Import Organization

```tsx
// 1. Node modules
import type { ComponentProps, JSX, ReactNode } from "react";

// 2. Internal packages (workspace)
import type { VariantProps } from "@codefast/tailwind-variants";

// 3. Relative imports (using @ alias)
import { buttonVariants } from "@/components/button";
import { Spinner } from "@/components/spinner";
```

### File Naming and Structure

- **Components**: Organized in folders with `component-name.tsx` (variants co-located) and `index.ts`
- **Hooks**: `use-hook-name.ts` with co-located tests
- **Tests**: `use-hook-name.test.ts` or `component-name.test.tsx`
- **Variants**: Defined with `tv` inside the component file using `@codefast/tailwind-variants`

### Component Structure Example

```tsx
// packages/ui/src/components/button.tsx
import type { ComponentProps, JSX, ReactNode } from "react";
import type { VariantProps } from "@codefast/tailwind-variants";

import { Spinner } from "@/components/spinner";
import { tv } from "@codefast/tailwind-variants";

const buttonVariants = tv({
  // variant definition
});

interface ButtonProps
  extends Omit<ComponentProps<"button">, "prefix">,
    VariantProps<typeof buttonVariants> {
  loaderPosition?: "prefix" | "suffix";
  loading?: boolean;
  prefix?: ReactNode;
  spinner?: ReactNode;
  suffix?: ReactNode;
}

function Button({
  children,
  className,
  disabled,
  loaderPosition = "prefix",
  loading,
  prefix,
  size,
  spinner,
  suffix,
  variant,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={buttonVariants({ className, size, variant })}
      data-slot="button"
      data-variant={variant}
      disabled={loading ?? disabled}
      type="button"
      {...props}
    >
      {loading && loaderPosition === "prefix" ? (spinner ?? <Spinner key="prefix" />) : prefix}
      {children}
      {loading && loaderPosition === "suffix" ? (spinner ?? <Spinner key="suffix" />) : suffix}
    </button>
  );
}

export { Button };
export type { ButtonProps };
```

### Hook Structure Example

```tsx
// packages/hooks/src/use-copy-to-clipboard.ts
import { useState } from "react";

export function useCopyToClipboard({
  onCopy,
  timeout = 2000,
}: { onCopy?: () => void; timeout?: number } = {}): {
  copyToClipboard: (value: string) => Promise<void>;
  isCopied: boolean;
} {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async (value: string): Promise<void> => {
    if (typeof globalThis === "undefined" || !navigator.clipboard.writeText) {
      return;
    }

    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);

      if (onCopy) {
        onCopy();
      }

      setTimeout(() => {
        setIsCopied(false);
      }, timeout);
    } catch (error) {
      console.error(error);
    }
  };

  return { copyToClipboard, isCopied };
}
```

## Testing

### Test Requirements

- **100% test success**: All tests must pass
- **Comprehensive coverage**: Aim for high test coverage
- **Accessibility testing**: Use jest-axe for accessibility compliance

### Test Structure

```tsx
// packages/hooks/src/__tests__/use-copy-to-clipboard.test.ts
import { useCopyToClipboard } from "@/use-copy-to-clipboard";
import { act, renderHook } from "@testing-library/react";

describe("useCopyToClipboard", () => {
  const originalClipboard = globalThis.navigator.clipboard;
  let mockWriteText: jest.Mock;

  beforeEach(() => {
    mockWriteText = jest.fn().mockResolvedValue(async () => {
      /* noop */
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: mockWriteText,
      },
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });

    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("should initialize with isCopied as false", () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.isCopied).toBe(false);
  });

  test("should copy text to clipboard and set isCopied to true", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("test text");
    });

    expect(mockWriteText).toHaveBeenCalledWith("test text");
    expect(result.current.isCopied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.isCopied).toBe(false);
  });
});
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for specific package
pnpm test --filter=@codefast/package-name
```

## Pull Request Process

### Before Submitting

1. **Ensure all quality gates pass**:
   ```bash
   pnpm test
   pnpm check-types
   pnpm lint
   pnpm build:packages
   ```

2. **Update documentation** if needed:
   - Update README.md files
   - Add/update JSDoc comments
   - Update type definitions

3. **Follow commit conventions**:
   - Use conventional commits format
   - Examples: `feat: add new button component`, `fix: resolve type error in utils`

### Submitting a Pull Request

1. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub with:
   - Clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - List any breaking changes

3. **Ensure CI passes**: All automated checks must pass

### Pull Request Guidelines

- **One feature per PR**: Keep PRs focused and manageable
- **Clear descriptions**: Explain what changed and why
- **Breaking changes**: Clearly document any breaking changes
- **Tests**: Include tests for new functionality
- **Documentation**: Update relevant documentation

## Release Process

### Version Management

This project uses [Changesets](https://github.com/changesets/changesets) for version management:

```bash
# Add a changeset for your changes
pnpm release

# Enter pre-release mode
pnpm release:canary:enter

# Exit pre-release mode
pnpm release:canary:exit
```

### Release Workflow

1. **Changesets**: Add changesets for your changes
2. **Version bumping**: Changesets automatically handle version bumping
3. **Changelog**: Automatic changelog generation
4. **Publishing**: Automated publishing to npm

## Getting Help

- **GitHub Issues**: [Create an issue](https://github.com/codefastlabs/codefast/issues) for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and general discussion
- **Documentation**: Check the [documentation site](https://codefast.dev) for detailed guides

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes
- Project documentation

Thank you for contributing to CodeFast!
