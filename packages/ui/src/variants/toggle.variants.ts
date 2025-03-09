import { tv } from 'tailwind-variants';

const toggleVariants = tv({
  base: "focus-visible:ring-ring focus-visible:ring-3 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition focus-visible:outline-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  variants: {
    icon: { false: '', true: 'px-0' },
    size: {
      '2xs': 'h-7', // 28px
      xs: 'h-8', // 32px
      sm: 'h-9', // 36px
      md: 'h-10', // 40px
      lg: 'h-11', // 44px
      xl: 'h-12', // 48px
    },
    variant: {
      default: 'bg-transparent',
      outline: 'border-input border',
    },
  },
  defaultVariants: {
    icon: false,
    size: 'md',
    variant: 'default',
  },
  compoundVariants: [
    { className: 'w-7', icon: true, size: '2xs' },
    { className: 'w-8', icon: true, size: 'xs' },
    { className: 'w-9', icon: true, size: 'sm' },
    { className: 'w-10', icon: true, size: 'md' },
    { className: 'w-11', icon: true, size: 'lg' },
    { className: 'w-12', icon: true, size: 'xl' },
  ],
});

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { toggleVariants };
