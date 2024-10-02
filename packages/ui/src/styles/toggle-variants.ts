import { tv, type VariantProps } from 'tailwind-variants';

const toggleVariants = tv({
  base: [
    'inline-flex shrink-0 select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-md px-2.5 text-sm font-medium transition',
    '[&>svg]:size-4 [&>svg]:shrink-0',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      default: 'data-[state=on]:bg-primary hover:bg-primary/20 data-[state=on]:text-primary-foreground',
      secondary: 'data-[state=on]:bg-secondary hover:bg-secondary/20 data-[state=on]:text-secondary-foreground',
      info: 'data-[state=on]:bg-info hover:bg-info/20 data-[state=on]:text-info-foreground',
      success: 'data-[state=on]:bg-success hover:bg-success/20 data-[state=on]:text-success-foreground',
      warning: 'data-[state=on]:bg-warning hover:bg-warning/20 data-[state=on]:text-warning-foreground',
      destructive: 'data-[state=on]:bg-destructive hover:bg-destructive/20 data-[state=on]:text-destructive-foreground',
      outline:
        'bg-background data-[state=on]:bg-accent hover:bg-accent/20 data-[state=on]:text-accent-foreground border-input border',
      ghost: 'data-[state=on]:bg-accent hover:bg-accent/20 data-[state=on]:text-accent-foreground',
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
      true: 'px-0',
    },
  },
  compoundVariants: [
    { className: 'size-7', icon: true, size: 'xxs' },
    { className: 'size-8', icon: true, size: 'xs' },
    { className: 'size-9', icon: true, size: 'sm' },
    { className: 'size-10', icon: true, size: 'md' },
    { className: 'size-11', icon: true, size: 'lg' },
    { className: 'size-12', icon: true, size: 'xl' },
  ],
  defaultVariants: {
    icon: false,
    size: 'md',
    variant: 'default',
  },
});

type ToggleVariantsProps = VariantProps<typeof toggleVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { toggleVariants, type ToggleVariantsProps };
