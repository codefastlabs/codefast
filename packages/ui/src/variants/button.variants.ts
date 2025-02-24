import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

const buttonVariants = tv({
  base: [
    'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition',
    '[&>svg]:shrink-0',
    'focus-visible:ring-ring/40 focus-visible:ring-3 focus-visible:outline-none',
    'disabled:opacity-50',
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
    { className: 'h-6', inside: true, size: 'xxs' },
    { className: 'h-6', inside: true, size: 'xs' },
    { className: 'h-7', inside: true, size: 'sm' },
    { className: 'h-8', inside: true, size: 'md' },
    { className: 'h-9', inside: true, size: 'lg' },
    { className: 'h-10', inside: true, size: 'xl' },
    // --
    { className: 'w-6', icon: true, inside: true, size: 'xxs' },
    { className: 'w-6', icon: true, inside: true, size: 'xs' },
    { className: 'w-7', icon: true, inside: true, size: 'sm' },
    { className: 'w-8', icon: true, inside: true, size: 'md' },
    { className: 'w-9', icon: true, inside: true, size: 'lg' },
    { className: 'w-10', icon: true, inside: true, size: 'xl' },
  ],
  defaultVariants: {
    icon: false,
    inside: false,
    size: 'md',
    variant: 'default',
  },
  variants: {
    icon: { false: '', true: 'px-0' },
    inside: { false: '', true: '' },
    size: {
      lg: 'h-11 [&>svg]:size-5', // 44px
      md: 'h-10 [&>svg]:size-4', // 40px
      sm: 'h-9 [&>svg]:size-4', // 36px
      xl: 'h-12 [&>svg]:size-5', // 48px
      xs: 'h-8 [&>svg]:size-3.5', // 32px
      xxs: 'h-7 [&>svg]:size-3', // 28px
    },
    variant: {
      default: ['bg-primary text-primary-foreground', 'hover:not-disabled:bg-primary/80'],
      destructive: ['bg-destructive text-destructive-foreground', 'hover:not-disabled:bg-destructive/80'],
      ghost: ['text-foreground', 'hover:not-disabled:bg-accent hover:not-disabled:text-accent-foreground'],
      info: ['bg-info text-info-foreground', 'hover:not-disabled:bg-info/80'],
      link: ['text-primary underline-offset-4', 'hover:not-disabled:underline'],
      outline: [
        'text-foreground border-input border',
        'focus-visible:border-ring',
        'hover:not-disabled:bg-accent hover:not-disabled:text-accent-foreground',
      ],
      secondary: ['bg-secondary text-secondary-foreground', 'hover:not-disabled:bg-secondary/80'],
      success: ['bg-success text-success-foreground', 'hover:not-disabled:bg-success/80'],
      warning: ['bg-warning text-warning-foreground', 'hover:not-disabled:bg-warning/80'],
    },
  },
});

type ButtonVariantsProps = VariantProps<typeof buttonVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { ButtonVariantsProps };
export { buttonVariants };
