import { tv, type VariantProps } from 'tailwind-variants';

const buttonVariants = tv({
  base: [
    'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/80',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      info: 'bg-info text-info-foreground hover:bg-info/80',
      success: 'bg-success text-success-foreground hover:bg-success/80',
      warning: 'bg-warning text-warning-foreground hover:bg-warning/80',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
      outline: 'bg-background hover:bg-accent hover:text-accent-foreground border-input border',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: {
      xxs: 'h-7 gap-2.5 px-2.5', // 28px
      xs: 'px-2.75 gap-2.75 h-8', // 32px
      sm: 'h-9 gap-3 px-3', // 36px
      md: 'px-3.25 gap-3.25 h-10', // 40px
      lg: 'h-11 gap-3.5 px-3.5', // 44px
      xl: 'px-3.75 gap-3.75 h-12', // 48px
    },
    icon: {
      true: 'px-0',
    },
  },
  compoundVariants: [
    { className: 'w-7', icon: true, size: 'xxs' },
    { className: 'w-8', icon: true, size: 'xs' },
    { className: 'w-9', icon: true, size: 'sm' },
    { className: 'w-10', icon: true, size: 'md' },
    { className: 'w-11', icon: true, size: 'lg' },
    { className: 'w-12', icon: true, size: 'xl' },
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
