---
description: Add a new component to @codefast/ui
---

## 1. Create Component File

Create `packages/ui/src/components/<component-name>.tsx`:

```tsx
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { tv, type VariantProps } from '@codefast/tailwind-variants';

const componentVariants = tv({
  base: 'inline-flex items-center justify-center',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      outline: 'border border-input bg-background',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

type ComponentProps = ComponentProps<'div'> & VariantProps<typeof componentVariants>;

const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={componentVariants({ variant, size, className })}
      {...props}
    />
  )
);

Component.displayName = 'Component';

export { Component, componentVariants, type ComponentProps };
```

## 2. Add to Index Export

Add to `packages/ui/src/index.ts`:

```typescript
export * from '@/components/<component-name>';
```

## 3. Build and Generate Exports

// turbo
```bash
pnpm --filter @codefast/ui build
```

// turbo
```bash
pnpm generate:exports packages/ui
```

## 4. Add Tests (Optional)

Create `packages/ui/src/components/<component-name>.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { Component } from '@/components/<component-name>';

describe('Component', () => {
  test('renders correctly', () => {
    render(<Component data-testid="component">Content</Component>);
    expect(screen.getByTestId('component')).toBeInTheDocument();
  });
});
```

## 5. Verify

```bash
pnpm --filter @codefast/ui lint
pnpm --filter @codefast/ui test
```
