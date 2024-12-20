import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

const buttonVariants = tv({
  base: [
    'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition',
    '[&>svg]:shrink-0',
    'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
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
      default: ['bg-primary text-primary-foreground shadow-sm', 'hover:bg-primary/80'],
      destructive: ['bg-destructive text-destructive-foreground shadow-sm', 'hover:bg-destructive/80'],
      ghost: ['text-foreground', 'hover:bg-accent hover:text-accent-foreground'],
      info: ['bg-info text-info-foreground shadow-sm', 'hover:bg-info/80'],
      link: ['text-primary underline-offset-4', 'hover:underline'],
      outline: ['text-foreground border-input border shadow-sm', 'hover:bg-accent hover:text-accent-foreground'],
      secondary: ['bg-secondary text-secondary-foreground shadow-sm', 'hover:bg-secondary/80'],
      success: ['bg-success text-success-foreground shadow-sm', 'hover:bg-success/80'],
      warning: ['bg-warning text-warning-foreground shadow-sm', 'hover:bg-warning/80'],
    },
  },
});

type ButtonVariantsProps = VariantProps<typeof buttonVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { ButtonVariantsProps };
export { buttonVariants };
