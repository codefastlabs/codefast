import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

const toggleVariants = tv({
  base: [
    'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition',
    '[&>svg]:shrink-0',
    'focus-visible:outline-none',
    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  compoundVariants: [
    // --
    { className: 'w-7', icon: true, size: 'xxs' },
    { className: 'w-8', icon: true, size: 'xs' },
    { className: 'w-9', icon: true, size: 'sm' },
    { className: 'w-10', icon: true, size: 'md' },
    { className: 'w-11', icon: true, size: 'lg' },
    { className: 'w-12', icon: true, size: 'xl' },
    // --
    { className: '[&>svg]:size-3', size: 'xxs' },
    { className: '[&>svg]:size-3.5', size: 'xs' },
  ],
  defaultVariants: {
    icon: false,
    size: 'md',
    variant: 'default',
  },
  variants: {
    icon: { false: '', true: 'px-0' },
    size: {
      lg: 'h-11 [&>svg]:size-5', // 44px
      md: 'h-10 [&>svg]:size-4', // 40px
      sm: 'h-9 [&>svg]:size-4', // 36px
      xl: 'h-12 [&>svg]:size-5', // 48px
      xs: 'h-8 [&>svg]:size-3.5', // 32px
      xxs: 'h-7 [&>svg]:size-3', // 28px
    },
    variant: {
      default: [
        'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm',
        'hover:bg-primary/80 hover:text-primary-foreground',
      ],
      destructive: [
        'data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground data-[state=on]:shadow-sm',
        'hover:bg-destructive/80 hover:text-destructive-foreground',
      ],
      ghost: [
        'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        'hover:bg-accent/80 hover:text-accent-foreground',
      ],
      info: [
        'data-[state=on]:bg-info data-[state=on]:text-info-foreground data-[state=on]:shadow-sm',
        'hover:bg-info/80 hover:text-info-foreground',
      ],
      outline: [
        'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        'hover:bg-accent/80 hover:text-accent-foreground',
        'bg-background border-input border shadow-sm',
      ],
      secondary: [
        'data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground data-[state=on]:shadow-sm',
        'hover:bg-secondary/80 hover:text-secondary-foreground',
      ],
      success: [
        'data-[state=on]:bg-success data-[state=on]:text-success-foreground data-[state=on]:shadow-sm',
        'hover:bg-success/80 hover:text-success-foreground',
      ],
      warning: [
        'data-[state=on]:bg-warning data-[state=on]:text-warning-foreground data-[state=on]:shadow-sm',
        'hover:bg-warning/80 hover:text-warning-foreground',
      ],
    },
  },
});

type ToggleVariantsProps = VariantProps<typeof toggleVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { ToggleVariantsProps };
export { toggleVariants };
