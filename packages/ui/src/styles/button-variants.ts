import { tv, type VariantProps } from 'tailwind-variants';

const buttonVariants = tv({
  base: [
    'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition',
    '[&>svg]:size-4 [&>svg]:shrink-0',
    'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      default: [
        'bg-primary text-primary-foreground shadow-sm',
        'hover:bg-primary/80',
        'focus-visible:bg-primary/80',
      ],
      secondary: [
        'bg-secondary text-secondary-foreground shadow-sm',
        'hover:bg-secondary/80',
        'focus-visible:bg-secondary/80',
      ],
      info: [
        'bg-info text-info-foreground shadow-sm',
        'hover:bg-info/80',
        'focus-visible:bg-info/80',
      ],
      success: [
        'bg-success text-success-foreground shadow-sm',
        'hover:bg-success/80',
        'focus-visible:bg-success/80',
      ],
      warning: [
        'bg-warning text-warning-foreground shadow-sm',
        'hover:bg-warning/80',
        'focus-visible:bg-warning/80',
      ],
      destructive: [
        'bg-destructive text-destructive-foreground shadow-sm',
        'hover:bg-destructive/80',
        'focus-visible:bg-destructive/80',
      ],
      outline: [
        'bg-background border-input border shadow-sm',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:bg-accent focus-visible:text-accent-foreground',
      ],
      ghost: [
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:bg-accent focus-visible:text-accent-foreground',
      ],
      link: [
        'text-primary underline-offset-4',
        'hover:underline',
        'focus-visible:underline',
      ],
    },
    size: {
      xxs: 'h-7', // 28px
      xs: 'h-8', // 32px
      sm: 'h-9', // 36px
      md: 'h-10', // 40px
      lg: 'h-11', // 44px
      xl: 'h-12', // 48px
    },
    icon: {
      true: 'px-2',
    },
  },
  compoundVariants: [
    // --
    { className: 'min-w-7', icon: true, size: 'xxs' },
    { className: 'min-w-8', icon: true, size: 'xs' },
    { className: 'min-w-9', icon: true, size: 'sm' },
    { className: 'min-w-10', icon: true, size: 'md' },
    { className: 'min-w-11', icon: true, size: 'lg' },
    { className: 'min-w-12', icon: true, size: 'xl' },
    // --
    { className: '[&>svg]:size-3', size: 'xxs' },
    { className: '[&>svg]:size-3.5', size: 'xs' },
  ],
  defaultVariants: {
    icon: false,
    size: 'md',
    variant: 'default',
  },
});

type ButtonVariantsProps = VariantProps<typeof buttonVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { buttonVariants, type ButtonVariantsProps };
