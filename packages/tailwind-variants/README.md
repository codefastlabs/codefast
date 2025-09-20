# Tailwind Variants

Type-safe variant API for Tailwind CSS with enhanced functionality and advanced TypeScript support for building flexible component styling systems.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![NPM Version](https://img.shields.io/npm/v/@codefast/tailwind-variants.svg)](https://www.npmjs.com/package/@codefast/tailwind-variants)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%2B-blue.svg)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@codefast/tailwind-variants)](https://bundlephobia.com/package/@codefast/tailwind-variants)

## Installation

Install the package via pnpm (recommended):

```bash
pnpm add @codefast/tailwind-variants
```

Or using npm:

```bash
npm install @codefast/tailwind-variants
```

**Peer Dependencies**:

The library works with Tailwind CSS (optional but recommended):

```bash
pnpm add tailwindcss
```

**Dependencies**:

The library uses these runtime dependencies:

- `clsx`: Utility for constructing className strings conditionally
- `tailwind-merge`: Utility for merging Tailwind CSS classes and resolving conflicts

**Requirements**:

- Node.js version 20.0.0 or higher
- TypeScript version 5.9.2 or higher (recommended)
- Tailwind CSS version 4.0.0 or higher (optional)

## Quick Start

```typescript
import { tv } from "@codefast/tailwind-variants";

const button = tv({
  base: "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    },
    size: {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4",
      lg: "h-11 px-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

// Usage
console.log(button());
// Output: "inline-flex items-center justify-center rounded-md font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"

console.log(button({ variant: "destructive", size: "lg" }));
// Output: "inline-flex items-center justify-center rounded-md font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 px-8"
```

## Usage

### Core Features

The library provides a comprehensive set of features for variant-based styling:

#### Variant System

- **Basic Variants**: Define component variations with different styling options
- **Boolean Variants**: Support for boolean-based variant conditions
- **Default Variants**: Set default values for variant properties
- **Nested Arrays**: Support for nested array structures in class definitions

#### Advanced Features

- **Slots**: Multi-part component styling with individual slot control
- **Compound Variants**: Apply styles when multiple variant conditions are met
- **Compound Slots**: Apply styles to specific slots based on variant conditions
- **Configuration Extension**: Extend and override existing variant configurations

#### Developer Experience

- **Type Safety**: Full TypeScript support with intelligent type inference
- **Tailwind Merge**: Built-in conflict resolution for Tailwind CSS classes
- **Performance**: Optimized for minimal runtime overhead
- **Flexibility**: Support for custom class merging and configuration

### Basic Variants

Create variant functions with different styling options:

```typescript
import { tv } from "@codefast/tailwind-variants";

const button = tv({
  base: "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    },
    size: {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4",
      lg: "h-11 px-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

// Usage examples
console.log(button());
// Output: "inline-flex items-center justify-center rounded-md font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"

console.log(button({ variant: "destructive", size: "lg" }));
// Output: "inline-flex items-center justify-center rounded-md font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 px-8"

console.log(button({ variant: "outline", size: "sm" }));
// Output: "inline-flex items-center justify-center rounded-md font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm"

// Add custom classes
console.log(button({ className: "w-full" }));
// Output: "inline-flex items-center justify-center rounded-md font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 w-full"
```

### Slots - Multi-part Components

Slots enable styling for components with multiple parts:

```typescript
import { tv } from "@codefast/tailwind-variants";

const card = tv({
  slots: {
    base: "rounded-lg border bg-card text-card-foreground shadow-sm",
    header: "flex flex-col space-y-1.5 p-6",
    content: "p-6 pt-0",
    footer: "flex items-center p-6 pt-0",
  },
  variants: {
    variant: {
      default: "",
      destructive: {
        base: "border-destructive",
        header: "text-destructive",
      },
    },
  },
});

// Usage
const cardStyles = card();
console.log(cardStyles.base());
// Output: "rounded-lg border bg-card text-card-foreground shadow-sm"

console.log(cardStyles.header());
// Output: "flex flex-col space-y-1.5 p-6"

console.log(cardStyles.content());
// Output: "p-6 pt-0"

console.log(cardStyles.footer());
// Output: "flex items-center p-6 pt-0"

// With variant
const destructiveCard = card({ variant: "destructive" });
console.log(destructiveCard.base());
// Output: "rounded-lg border bg-card text-card-foreground shadow-sm border-destructive"

console.log(destructiveCard.header());
// Output: "flex flex-col space-y-1.5 p-6 text-destructive"
```

### Compound Variants

Apply styles when multiple variant conditions are met:

```typescript
import { tv } from "@codefast/tailwind-variants";

const alert = tv({
  base: "relative w-full rounded-lg border px-4 py-3",
  variants: {
    variant: {
      default: "bg-background text-foreground",
      destructive: "border-destructive/50 text-destructive",
    },
    size: {
      sm: "text-sm",
      md: "text-base",
    },
  },
  compoundVariants: [
    {
      variant: "destructive",
      size: "md",
      className: "font-semibold", // Only applies when variant=destructive AND size=md
    },
  ],
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

// Usage examples
console.log(alert({ size: "sm" }));
// Output: "relative w-full rounded-lg border px-4 py-3 bg-background text-foreground text-sm"

console.log(alert({ variant: "destructive", size: "md" }));
// Output: "relative w-full rounded-lg border px-4 py-3 border-destructive/50 text-destructive text-base font-semibold"

console.log(alert({ variant: "destructive", size: "sm" }));
// Output: "relative w-full rounded-lg border px-4 py-3 border-destructive/50 text-destructive text-sm"
```

### Boolean Variants

Support for boolean-based variant conditions:

```typescript
import { tv } from "@codefast/tailwind-variants";

const toggle = tv({
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium",
  variants: {
    pressed: {
      true: "bg-accent text-accent-foreground",
      false: "bg-transparent",
    },
    disabled: {
      true: "opacity-50 pointer-events-none",
      false: "",
    },
  },
  defaultVariants: {
    pressed: false,
    disabled: false,
  },
});

// Usage with boolean values
console.log(toggle());
// Output: "inline-flex items-center justify-center rounded-md text-sm font-medium bg-transparent"

console.log(toggle({ pressed: true }));
// Output: "inline-flex items-center justify-center rounded-md text-sm font-medium bg-accent text-accent-foreground"

console.log(toggle({ disabled: true }));
// Output: "inline-flex items-center justify-center rounded-md text-sm font-medium bg-transparent opacity-50 pointer-events-none"

console.log(toggle({ pressed: true, disabled: true }));
// Output: "inline-flex items-center justify-center rounded-md text-sm font-medium bg-accent text-accent-foreground opacity-50 pointer-events-none"
```

### Configuration Extension

Extend existing configurations for reusability:

```typescript
import { tv } from "@codefast/tailwind-variants";

// Base button configuration
const baseButton = tv({
  base: "inline-flex items-center justify-center rounded-md font-medium",
  variants: {
    size: {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

// Extended icon button
const iconButton = tv({
  extend: baseButton,
  base: "aspect-square", // Additional base classes
  variants: {
    variant: {
      // New variant options
      ghost: "hover:bg-accent hover:text-accent-foreground",
      outline: "border border-input",
    },
  },
  defaultVariants: {
    variant: "ghost",
  },
});

// Usage
console.log(baseButton());
// Output: "inline-flex items-center justify-center rounded-md font-medium h-10 px-4"

console.log(iconButton());
// Output: "inline-flex items-center justify-center rounded-md font-medium aspect-square h-10 px-4 hover:bg-accent hover:text-accent-foreground"

console.log(iconButton({ variant: "outline", size: "sm" }));
// Output: "inline-flex items-center justify-center rounded-md font-medium aspect-square h-9 px-3 text-sm border border-input"
```

## Advanced Features

### Compound Slots

Apply styles to specific slots based on variant conditions:

```typescript
import { tv } from "@codefast/tailwind-variants";

const dialog = tv({
  slots: {
    overlay: "fixed inset-0 bg-background/80 backdrop-blur-sm",
    content: "fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2",
    header: "flex flex-col space-y-1.5 text-center sm:text-left",
    footer: "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
  },
  variants: {
    size: {
      sm: "",
      lg: "",
    },
  },
  compoundSlots: [
    {
      size: "sm",
      slots: ["content"],
      className: "max-w-md",
    },
    {
      size: "lg",
      slots: ["content"],
      className: "max-w-2xl",
    },
  ],
});

// Usage
const smallDialog = dialog({ size: "sm" });
console.log(smallDialog.content());
// Output: "fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md"

const largeDialog = dialog({ size: "lg" });
console.log(largeDialog.content());
// Output: "fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-2xl"
```

### Global Configuration with createTV

Create a factory with global configuration settings:

```typescript
import { createTV } from "@codefast/tailwind-variants";

// Create factory with global configuration
const { tv, cn } = createTV({
  twMerge: true,
  twMergeConfig: {
    extend: {
      classGroups: {
        // Custom class groups for better conflict resolution
        "font-size": ["text-custom-sm", "text-custom-lg"],
      },
    },
  },
});

// Use tv with global configuration
const button = tv({
  base: "px-4 py-2 rounded",
  variants: {
    variant: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-500 text-white",
    },
  },
});

// Use cn utility with global configuration
const classes = cn("px-4 py-2", "px-6 py-3"); // Tailwind merge resolves conflicts
console.log(classes);
// Output: "px-6 py-3" (px-6 overrides px-4, py-3 overrides py-2)
```

### Nested Arrays Support

Support for nested array structures in class definitions:

```typescript
import { tv } from "@codefast/tailwind-variants";

const component = tv({
  base: ["base-class-1", ["base-class-2", ["base-class-3", "base-class-4"]]], // Automatically flattened
  variants: {
    variant: {
      primary: ["text-blue-500", ["bg-blue-50", ["hover:bg-blue-100", "focus:ring-blue-200"]]],
    },
  },
});
```

## API Reference

### tv(config, options?)

Creates a variant function from configuration.

**Parameters**:

- `config`: Configuration object defining variants, slots, and styling
- `options?`: Optional Tailwind Variants configuration for customization

**Returns**: Configured variant function

### createTV(globalConfig?)

Creates a factory with global configuration settings.

**Parameters**:

- `globalConfig?`: Global Tailwind Variants configuration applied to all instances

**Returns**: Object containing `tv` and `cn` functions with global settings

### cn(...classes)

Combines and merges CSS classes using tailwind-merge for conflict resolution.

**Parameters**:

- `...classes`: CSS classes to combine and merge

**Returns**: Merged class string with conflicts resolved

### cx(...classes)

Combines CSS classes using clsx without conflict resolution.

**Parameters**:

- `...classes`: CSS classes to combine

**Returns**: Combined class string without merging

### VariantProps<T>

Extracts variant props type from a variant function for TypeScript integration.

**Type Parameter**:

- `T`: Variant function type

**Returns**: Props type object for component integration

### TypeScript Integration

The library provides comprehensive TypeScript support:

```typescript
import { tv, type VariantProps } from "@codefast/tailwind-variants";

const button = tv({
  base: "px-4 py-2 rounded",
  variants: {
    variant: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-500 text-white",
    },
    size: {
      sm: "text-sm",
      lg: "text-lg",
    },
  },
});

// Extract props type
type ButtonProps = VariantProps<typeof button>;
// Type: { variant?: "primary" | "secondary"; size?: "sm" | "lg"; className?: string; }

// Usage in React components
interface MyButtonProps extends ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

const MyButton: React.FC<MyButtonProps> = ({
  variant,
  size,
  className,
  children,
  onClick
}) => {
  return (
    <button
      className={button({ variant, size, className })}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### Slots Type Safety

Slots provide full type safety for multi-part components:

```typescript
import { tv } from "@codefast/tailwind-variants";

const card = tv({
  slots: {
    base: "rounded-lg border",
    header: "p-4 border-b",
    content: "p-4",
  },
  variants: {
    variant: {
      default: "",
      elevated: {
        base: "shadow-lg",
        header: "bg-muted",
      },
    },
  },
});

// Type inference for slots
const styles = card({ variant: "elevated" });
// styles.base() - available
// styles.header() - available
// styles.content() - available
// styles.nonExistent() - TypeScript error!
```

### Configuration Options

Customize Tailwind merge behavior and other settings:

```typescript
import { tv } from "@codefast/tailwind-variants";

const component = tv(
  {
    base: "px-4 py-2",
    variants: {
      size: {
        sm: "px-2 py-1",
        lg: "px-6 py-3",
      },
    },
  },
  {
    twMerge: true, // Enable/disable tailwind merge (default: true)
    twMergeConfig: {
      extend: {
        classGroups: {
          // Custom class groups for better conflict resolution
          "font-size": ["text-custom-sm", "text-custom-lg"],
        },
      },
    },
  },
);
```

### Disable Tailwind Merge

In some cases, you may want to disable Tailwind merge:

```typescript
import { tv } from "@codefast/tailwind-variants";

const component = tv(
  {
    base: "px-4 py-2",
    variants: {
      size: {
        sm: "px-2 py-1", // Will not merge with base classes
      },
    },
  },
  {
    twMerge: false, // Disable tailwind merge
  },
);

console.log(component({ size: "sm" }));
// Output: "px-4 py-2 px-2 py-1" (both px classes will be kept)
```

## Utility Functions

### cn Function

Combine and merge CSS classes with conflict resolution:

```typescript
import { cn } from "@codefast/tailwind-variants";

// Basic usage
const classes = cn("px-4 py-2", "bg-blue-500", "text-white");
console.log(classes);
// Output: "px-4 py-2 bg-blue-500 text-white"

// With conflicting classes (tailwind-merge resolves conflicts)
const conflicting = cn("px-4 py-2", "px-6 py-3");
console.log(conflicting);
// Output: "px-6 py-3" (later classes override earlier ones)

// With conditional classes
const conditional = cn(
  "base-class",
  true && "condition-true-class",
  false && "condition-false-class",
  { "object-condition": true },
);
console.log(conditional);
// Output: "base-class condition-true-class object-condition"
```

### cx Function

Combine CSS classes without conflict resolution:

```typescript
import { cx } from "@codefast/tailwind-variants";

const classes = cx("px-4 py-2", "px-6 py-3");
console.log(classes);
// Output: "px-4 py-2 px-6 py-3" (no conflict resolution)
```

## Best Practices

### Component Library Pattern

Create consistent component libraries:

```typescript
// components/button.ts
import { tv, type VariantProps } from "@codefast/tailwind-variants";

export const buttonVariants = tv({
  base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "underline-offset-4 hover:underline text-primary",
    },
    size: {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 rounded-md",
      lg: "h-11 px-8 rounded-md",
      icon: "h-10 w-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonProps = VariantProps<typeof buttonVariants>;

// components/Button.tsx (React component)
import React from "react";
import { buttonVariants, type ButtonProps } from "./button";

interface ButtonComponentProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonProps {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonComponentProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
```

### Theme System Pattern

Create theme systems with global configuration:

```typescript
// theme/variants.ts
import { createTV } from "@codefast/tailwind-variants";

// Global theme configuration
const { tv: themeTV, cn: themeCN } = createTV({
  twMerge: true,
  twMergeConfig: {
    extend: {
      classGroups: {
        // Theme-specific class groups
        "theme-color": ["theme-primary", "theme-secondary", "theme-accent"],
      },
    },
  },
});

// Export themed utilities
export { themeTV as tv, themeCN as cn };

// components/themed-button.ts
import { tv } from "../theme/variants";

export const themedButton = tv({
  base: "inline-flex items-center justify-center rounded-md font-medium",
  variants: {
    theme: {
      light: "bg-white text-black border border-gray-200",
      dark: "bg-gray-900 text-white border border-gray-700",
    },
    variant: {
      primary: "theme-primary", // Handled by custom class group
      secondary: "theme-secondary",
    },
  },
});
```

### Responsive Design Pattern

Use with responsive classes for mobile-first design:

```typescript
import { tv } from "@codefast/tailwind-variants";

const responsiveCard = tv({
  base: "rounded-lg border bg-card text-card-foreground shadow-sm",
  variants: {
    size: {
      sm: "p-4 sm:p-6",
      md: "p-6 sm:p-8 lg:p-10",
      lg: "p-8 sm:p-10 lg:p-12 xl:p-16",
    },
    layout: {
      stack: "flex flex-col space-y-4",
      grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
    },
  },
  compoundVariants: [
    {
      size: "lg",
      layout: "grid",
      className: "lg:grid-cols-4 xl:grid-cols-5",
    },
  ],
  defaultVariants: {
    size: "md",
    layout: "stack",
  },
});
```

### Performance Optimization

Optimize for performance:

```typescript
// ✅ Good: Define variants outside component
const buttonVariants = tv({
  base: "px-4 py-2 rounded",
  variants: {
    variant: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-500 text-white",
    },
  },
});

const Button = ({ variant, className, ...props }) => {
  return (
    <button
      className={buttonVariants({ variant, className })}
      {...props}
    />
  );
};

// ❌ Bad: Define variants inside component (recreated on every render)
const Button = ({ variant, className, ...props }) => {
  const buttonVariants = tv({
    base: "px-4 py-2 rounded",
    variants: {
      variant: {
        primary: "bg-blue-500 text-white",
        secondary: "bg-gray-500 text-white",
      },
    },
  });

  return (
    <button
      className={buttonVariants({ variant, className })}
      {...props}
    />
  );
};
```

## Performance Considerations

### Bundle Size

The library is optimized for minimal bundle impact:

- Tree-shakeable exports for unused functionality
- Minimal runtime dependencies
- Efficient class processing algorithms

### Runtime Performance

- Lazy evaluation of variant resolution
- Efficient class merging algorithms
- Minimal memory footprint
- Cached tailwind-merge instances for reuse

## Migration Guide

### From class-variance-authority (cva)

Migrating from other variant libraries:

```typescript
// Before (cva)
import { cva } from "class-variance-authority";

const button = cva("px-4 py-2 rounded", {
  variants: {
    variant: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-500 text-white",
    },
  },
});

// After (@codefast/tailwind-variants)
import { tv } from "@codefast/tailwind-variants";

const button = tv({
  base: "px-4 py-2 rounded",
  variants: {
    variant: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-500 text-white",
    },
  },
});
```

### Key Differences

1. **API Structure**: Uses `base` property instead of first string parameter
2. **Slots Support**: Native support for multi-part components
3. **Extended Configuration**: Built-in support for configuration extension
4. **Enhanced TypeScript**: Improved type inference and safety
5. **Tailwind Merge**: Built-in conflict resolution

## Contributing

We welcome all contributions! To get started with development:

### Environment Setup

1. Fork this repository
2. Clone to your machine: `git clone <your-fork-url>`
3. Install dependencies: `pnpm install`
4. Create a new branch: `git checkout -b feature/feature-name`

### Development Workflow

```bash
# Build all packages
pnpm build:packages

# Development mode for tailwind-variants
pnpm dev --filter=@codefast/tailwind-variants

# Run tests
pnpm test --filter=@codefast/tailwind-variants

# Run tests with coverage
pnpm test:coverage --filter=@codefast/tailwind-variants

# Lint and format
pnpm lint:fix
pnpm format
```

### Adding New Features

1. Implement feature in `src/` directory
2. Add comprehensive tests in `tests/` directory
3. Update TypeScript types as needed
4. Update documentation
5. Submit a pull request

See details at [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Contact

- npm: [@codefast/tailwind-variants](https://www.npmjs.com/package/@codefast/tailwind-variants)
- GitHub: [codefastlabs/codefast](https://github.com/codefastlabs/codefast)
- Issues: [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- Documentation: [Component Docs](https://codefast.dev/docs/components)

## Acknowledgments

This library is built on top of excellent open-source projects:

- **[clsx](https://github.com/lukeed/clsx)** - Utility for constructing className strings
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Utility for merging Tailwind CSS classes
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a complete list of changes and version history.
