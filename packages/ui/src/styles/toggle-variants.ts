import { tv, type VariantProps } from 'tailwind-variants';

const toggleVariants = tv({
  base: [
    'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition',
    '[&>svg]:size-4 [&>svg]:shrink-0',
    'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      default: [
        'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm',
        'hover:bg-primary/80 hover:text-primary-foreground',
        'focus-visible::bg-primary/80 focus-visible:text-primary-foreground',
      ],
      secondary: [
        'data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground data-[state=on]:shadow-sm',
        'hover:bg-secondary/80 hover:text-secondary-foreground',
        'focus-visible::bg-secondary/80 focus-visible:text-secondary-foreground',
      ],
      info: [
        'data-[state=on]:bg-info data-[state=on]:text-info-foreground data-[state=on]:shadow-sm',
        'hover:bg-info/80 hover:text-info-foreground',
        'focus-visible::bg-info/80 focus-visible:text-info-foreground',
      ],
      success: [
        'data-[state=on]:bg-success data-[state=on]:text-success-foreground data-[state=on]:shadow-sm',
        'hover:bg-success/80 hover:text-success-foreground',
        'focus-visible::bg-success/80 focus-visible:text-success-foreground',
      ],
      warning: [
        'data-[state=on]:bg-warning data-[state=on]:text-warning-foreground data-[state=on]:shadow-sm',
        'hover:bg-warning/80 hover:text-warning-foreground',
        'focus-visible::bg-warning/80 focus-visible:text-warning-foreground',
      ],
      destructive: [
        'data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground data-[state=on]:shadow-sm',
        'hover:bg-destructive/80 hover:text-destructive-foreground',
        'focus-visible::bg-destructive/80 focus-visible:text-destructive-foreground',
      ],
      outline: [
        'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        'hover:bg-accent/80 hover:text-accent-foreground',
        'focus-visible::bg-accent/80 focus-visible:text-accent-foreground',
        'bg-background border-input border shadow-sm',
      ],
      ghost: [
        'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        'hover:bg-accent/80 hover:text-accent-foreground',
        'focus-visible:bg-accent/80 focus-visible:text-accent-foreground',
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
      true: 'p-0',
    },
  },
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
});

type ToggleVariantsProps = VariantProps<typeof toggleVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { toggleVariants, type ToggleVariantsProps };
