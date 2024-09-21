import { tv, type VariantProps } from 'tailwind-variants';

const buttonVariants = tv({
  base: 'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
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
      xxs: 'h-7 px-2',
      xs: 'h-8 px-2',
      sm: 'h-9 px-3',
      md: 'h-10 px-3',
      lg: 'h-11 px-4',
      xl: 'h-12 px-4',
    },
    shape: {
      rectangle: '',
      square: '',
      circle: 'rounded-full',
    },
  },
  compoundVariants: [
    { size: 'xxs', shape: ['square', 'circle'], className: 'w-7 px-0' },
    { size: 'xs', shape: ['square', 'circle'], className: 'w-8 px-0' },
    { size: 'sm', shape: ['square', 'circle'], className: 'w-9 px-0' },
    { size: 'md', shape: ['square', 'circle'], className: 'w-10 px-0' },
    { size: 'lg', shape: ['square', 'circle'], className: 'w-11 px-0' },
    { size: 'xl', shape: ['square', 'circle'], className: 'w-12 px-0' },
  ],
  defaultVariants: {
    shape: 'rectangle',
    size: 'md',
    variant: 'default',
  },
});

type ButtonVariantsProps = VariantProps<typeof buttonVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { buttonVariants, type ButtonVariantsProps };
