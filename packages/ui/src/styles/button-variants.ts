import { tv, type VariantProps } from 'tailwind-variants';

const buttonVariants = tv({
  base: [
    'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition',
    '[&>svg]:size-4 [&>svg]:shrink-0',
    'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
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
      xxs: 'h-7', // 28px
      xs: 'h-8', // 32px
      sm: 'h-9', // 36px
      md: 'h-10', // 40px
      lg: 'h-11', // 44px
      xl: 'h-12', // 48px
    },
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
  },
});

type ButtonVariantsProps = VariantProps<typeof buttonVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { buttonVariants, type ButtonVariantsProps };
