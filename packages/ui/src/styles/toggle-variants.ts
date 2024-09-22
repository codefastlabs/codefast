import { tv, type VariantProps } from 'tailwind-variants';

const toggleVariants = tv({
  base: [
    'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition',
    '[&_svg]:size-4 [&_svg]:shrink-0',
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

type ToggleVariantsProps = VariantProps<typeof toggleVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { toggleVariants, type ToggleVariantsProps };
