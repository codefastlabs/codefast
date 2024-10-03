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
        'hover:bg-primary/20',
      ],
      secondary: [
        'data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground data-[state=on]:shadow-sm',
        'hover:bg-secondary/20',
      ],
      info: [
        'data-[state=on]:bg-info data-[state=on]:text-info-foreground data-[state=on]:shadow-sm',
        'hover:bg-info/20',
      ],
      success: [
        'data-[state=on]:bg-success data-[state=on]:text-success-foreground data-[state=on]:shadow-sm',
        'hover:bg-success/20',
      ],
      warning: [
        'data-[state=on]:bg-warning data-[state=on]:text-warning-foreground data-[state=on]:shadow-sm',
        'hover:bg-warning/20',
      ],
      destructive: [
        'data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground data-[state=on]:shadow-sm',
        'hover:bg-destructive/20',
      ],
      outline: [
        'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        'hover:bg-accent/20',
        'bg-background border-input border shadow-sm',
      ],
      ghost: ['data-[state=on]:bg-accent data-[state=on]:text-accent-foreground', 'hover:bg-accent/20'],
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
