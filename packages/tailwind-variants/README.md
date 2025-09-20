# @codefast/tailwind-variants

**Tailwind CSS variants utilities with enhanced functionality and advanced type safety**

[![Version](https://img.shields.io/npm/v/@codefast/tailwind-variants.svg)](https://www.npmjs.com/package/@codefast/tailwind-variants)
[![License](https://img.shields.io/npm/l/@codefast/tailwind-variants.svg)](https://github.com/codefastlabs/codefast/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## Tổng quan

`@codefast/tailwind-variants` là một thư viện mạnh mẽ được thiết kế để tạo ra các API variant type-safe cho Tailwind CSS. Thư viện cho phép developers xây dựng các hệ thống component linh hoạt với cú pháp đơn giản, type safety hoàn toàn, và khả năng xử lý xung đột class tự động.

### Tính năng chính

- 🎯 **Type Safety hoàn toàn**: Hỗ trợ TypeScript với type inference mạnh mẽ
- 🔧 **Flexible API**: Hỗ trợ variants, slots, compound variants, và configuration extension
- ⚡ **Performance tối ưu**: Minimal runtime overhead với efficient class merging
- 🎨 **Tailwind Merge tích hợp**: Tự động giải quyết xung đột CSS classes
- 🧩 **Component Composition**: Hỗ trợ slots cho multi-part components
- 🔄 **Configuration Extension**: Dễ dàng extend và override configurations
- 🎭 **Boolean Variants**: Hỗ trợ boolean variants với type safety
- 🏗️ **Compound Variants**: Apply classes khi nhiều conditions được thỏa mãn

## Cài đặt

```bash
# npm
npm install @codefast/tailwind-variants

# yarn
yarn add @codefast/tailwind-variants

# pnpm
pnpm add @codefast/tailwind-variants
```

### Dependencies

Thư viện sử dụng các dependencies sau:

- `clsx`: Utility for constructing className strings conditionally
- `tailwind-merge`: Utility for merging Tailwind CSS classes

## Cách sử dụng cơ bản

### 1. Basic Variants

Tạo một variant function đơn giản với các variant khác nhau:

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

// Sử dụng
console.log(button());
// Output: "inline-flex items-center justify-center rounded-md font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"

console.log(button({ variant: "destructive", size: "lg" }));
// Output: "inline-flex items-center justify-center rounded-md font-medium transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 px-8"

console.log(button({ variant: "outline", size: "sm" }));
// Output: "inline-flex items-center justify-center rounded-md font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-sm"

// Thêm custom classes
console.log(button({ className: "w-full" }));
// Output: "inline-flex items-center justify-center rounded-md font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 w-full"
```

### 2. Slots - Multi-part Components

Slots cho phép bạn tạo styling cho các component có nhiều phần:

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

// Sử dụng
const cardStyles = card();
console.log(cardStyles.base());
// Output: "rounded-lg border bg-card text-card-foreground shadow-sm"

console.log(cardStyles.header());
// Output: "flex flex-col space-y-1.5 p-6"

console.log(cardStyles.content());
// Output: "p-6 pt-0"

console.log(cardStyles.footer());
// Output: "flex items-center p-6 pt-0"

// Với variant
const destructiveCard = card({ variant: "destructive" });
console.log(destructiveCard.base());
// Output: "rounded-lg border bg-card text-card-foreground shadow-sm border-destructive"

console.log(destructiveCard.header());
// Output: "flex flex-col space-y-1.5 p-6 text-destructive"
```

### 3. Compound Variants

Compound variants cho phép apply classes khi nhiều conditions được thỏa mãn:

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
      className: "font-semibold", // Chỉ apply khi variant=destructive VÀ size=md
    },
  ],
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

// Sử dụng
console.log(alert({ size: "sm" }));
// Output: "relative w-full rounded-lg border px-4 py-3 bg-background text-foreground text-sm"

console.log(alert({ variant: "destructive", size: "md" }));
// Output: "relative w-full rounded-lg border px-4 py-3 border-destructive/50 text-destructive text-base font-semibold"

console.log(alert({ variant: "destructive", size: "sm" }));
// Output: "relative w-full rounded-lg border px-4 py-3 border-destructive/50 text-destructive text-sm"
```

### 4. Boolean Variants

Hỗ trợ boolean variants với type safety:

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

// Sử dụng
console.log(toggle());
// Output: "inline-flex items-center justify-center rounded-md text-sm font-medium bg-transparent"

console.log(toggle({ pressed: true }));
// Output: "inline-flex items-center justify-center rounded-md text-sm font-medium bg-accent text-accent-foreground"

console.log(toggle({ disabled: true }));
// Output: "inline-flex items-center justify-center rounded-md text-sm font-medium bg-transparent opacity-50 pointer-events-none"

console.log(toggle({ pressed: true, disabled: true }));
// Output: "inline-flex items-center justify-center rounded-md text-sm font-medium bg-accent text-accent-foreground opacity-50 pointer-events-none"
```

### 5. Configuration Extension

Extend existing configurations để tái sử dụng và mở rộng:

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
  base: "aspect-square", // Thêm base classes
  variants: {
    variant: {
      // Thêm variant mới
      ghost: "hover:bg-accent hover:text-accent-foreground",
      outline: "border border-input",
    },
  },
  defaultVariants: {
    variant: "ghost",
  },
});

// Sử dụng
console.log(baseButton());
// Output: "inline-flex items-center justify-center rounded-md font-medium h-10 px-4"

console.log(iconButton());
// Output: "inline-flex items-center justify-center rounded-md font-medium aspect-square h-10 px-4 hover:bg-accent hover:text-accent-foreground"

console.log(iconButton({ variant: "outline", size: "sm" }));
// Output: "inline-flex items-center justify-center rounded-md font-medium aspect-square h-9 px-3 text-sm border border-input"
```

## Advanced Features

### 1. Compound Slots

Compound slots cho phép apply classes vào specific slots khi conditions được thỏa mãn:

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

// Sử dụng
const smallDialog = dialog({ size: "sm" });
console.log(smallDialog.content());
// Output: "fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md"

const largeDialog = dialog({ size: "lg" });
console.log(largeDialog.content());
// Output: "fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-2xl"
```

### 2. Global Configuration với createTV

Tạo một factory với global configuration:

```typescript
import { createTV } from "@codefast/tailwind-variants";

// Tạo factory với global config
const { tv, cn } = createTV({
  twMerge: true,
  twMergeConfig: {
    extend: {
      classGroups: {
        // Custom class groups
      },
    },
  },
});

// Sử dụng tv với global config
const button = tv({
  base: "px-4 py-2 rounded",
  variants: {
    variant: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-500 text-white",
    },
  },
});

// Sử dụng cn utility
const classes = cn("px-4 py-2", "px-6 py-3"); // Tailwind merge sẽ resolve conflicts
console.log(classes);
// Output: "px-6 py-3" (px-6 overrides px-4, py-3 overrides py-2)
```

### 3. Nested Arrays Support

Hỗ trợ nested arrays trong class definitions:

```typescript
import { tv } from "@codefast/tailwind-variants";

const component = tv({
  base: ["base-class-1", ["base-class-2", ["base-class-3", "base-class-4"]]], // Sẽ được flatten tự động
  variants: {
    variant: {
      primary: ["text-blue-500", ["bg-blue-50", ["hover:bg-blue-100", "focus:ring-blue-200"]]],
    },
  },
});
```

## TypeScript Support

### Type Inference

Thư viện cung cấp type inference mạnh mẽ:

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

// Usage trong React component
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

Slots cũng có type safety hoàn toàn:

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

// Type inference cho slots
const styles = card({ variant: "elevated" });
// styles.base() - available
// styles.header() - available
// styles.content() - available
// styles.nonExistent() - TypeScript error!
```

## Configuration Options

### Tailwind Merge Configuration

Customize Tailwind merge behavior:

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

Trong một số trường hợp, bạn có thể muốn disable Tailwind merge:

```typescript
import { tv } from "@codefast/tailwind-variants";

const component = tv(
  {
    base: "px-4 py-2",
    variants: {
      size: {
        sm: "px-2 py-1", // Sẽ không merge với base classes
      },
    },
  },
  {
    twMerge: false, // Disable tailwind merge
  },
);

console.log(component({ size: "sm" }));
// Output: "px-4 py-2 px-2 py-1" (cả hai px classes sẽ được giữ lại)
```

## Utility Functions

### cn Function

Combine và merge CSS classes:

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

Combine CSS classes without merging (using clsx only):

```typescript
import { cx } from "@codefast/tailwind-variants";

const classes = cx("px-4 py-2", "px-6 py-3");
console.log(classes);
// Output: "px-4 py-2 px-6 py-3" (no conflict resolution)
```

## Patterns và Best Practices

### 1. Component Library Pattern

Tạo một consistent component library:

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

### 2. Theme System Pattern

Tạo theme system với createTV:

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
      primary: "theme-primary", // Will be handled by custom class group
      secondary: "theme-secondary",
    },
  },
});
```

### 3. Responsive Design Pattern

Sử dụng với responsive classes:

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

## Performance Considerations

### 1. Bundle Size

Thư viện được tối ưu cho bundle size:

- Tree-shakeable exports
- Minimal runtime dependencies
- Efficient class processing

### 2. Runtime Performance

- Lazy evaluation của variant resolution
- Efficient class merging algorithms
- Minimal memory footprint
- Cached tailwind-merge instances

### 3. Best Practices

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

## Migration Guide

### From other variant libraries

Nếu bạn đang sử dụng libraries khác như `cva` hoặc `class-variance-authority`:

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

1. **API Structure**: `base` thay vì string đầu tiên
2. **Slots Support**: Native support cho multi-part components
3. **Extended Configuration**: Built-in support cho configuration extension
4. **Better TypeScript**: Improved type inference và safety
5. **Tailwind Merge**: Built-in conflict resolution

## API Reference

### tv(config, options?)

Tạo variant function từ configuration.

**Parameters:**

- `config`: Configuration object
- `options?`: Optional Tailwind Variants configuration

**Returns:** Variant function

### createTV(globalConfig?)

Tạo factory với global configuration.

**Parameters:**

- `globalConfig?`: Global Tailwind Variants configuration

**Returns:** Object với `tv` và `cn` functions

### cn(...classes)

Combine và merge CSS classes sử dụng tailwind-merge.

**Parameters:**

- `...classes`: CSS classes để combine

**Returns:** Merged class string

### cx(...classes)

Combine CSS classes sử dụng clsx (không merge).

**Parameters:**

- `...classes`: CSS classes để combine

**Returns:** Combined class string

### VariantProps<T>

Extract variant props type từ variant function.

**Type Parameter:**

- `T`: Variant function type

**Returns:** Props type object

## Examples Repository

Tham khảo thêm examples tại:

- [Button Components](./examples/button.md)
- [Card Components](./examples/card.md)
- [Form Components](./examples/form.md)
- [Navigation Components](./examples/navigation.md)

## Contributing

Contributions are welcome! Please read our [contributing guide](../../CONTRIBUTING.md) for details.

## License

MIT © [CodeFast Labs](https://github.com/codefastlabs)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## Support

- [GitHub Issues](https://github.com/codefastlabs/codefast/issues)
- [Discussions](https://github.com/codefastlabs/codefast/discussions)
- [Documentation](https://codefast-docs.vercel.app)
