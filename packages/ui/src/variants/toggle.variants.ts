import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

const toggleVariants = tv({
  base: 'focus-visible:ring-ring focus-visible:ring-3 not-disabled:data-[state=on]:shadow-xs inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition focus-visible:outline-none disabled:opacity-50 [&>svg]:shrink-0',
  variants: {
    icon: {
      false: '',
      true: 'px-0',
    },
    size: {
      '2xs': 'h-7 [&>svg]:size-3', // 28px
      xs: 'h-8 [&>svg]:size-3.5', // 32px
      sm: 'h-9 [&>svg]:size-4', // 36px
      md: 'h-10 [&>svg]:size-4', // 40px
      lg: 'h-11 [&>svg]:size-5', // 44px
      xl: 'h-12 [&>svg]:size-5', // 48px
    },
    variant: {
      default:
        'not-disabled:data-[state=on]:shadow-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:not-disabled:bg-primary-hover hover:not-disabled:text-primary-foreground',
      secondary:
        'not-disabled:data-[state=on]:shadow-secondary data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground hover:not-disabled:bg-secondary-hover hover:not-disabled:text-secondary-foreground',
      info: 'not-disabled:data-[state=on]:shadow-info data-[state=on]:bg-info data-[state=on]:text-info-foreground hover:not-disabled:bg-info-hover hover:not-disabled:text-info-foreground',
      success:
        'not-disabled:data-[state=on]:shadow-success data-[state=on]:bg-success data-[state=on]:text-success-foreground hover:not-disabled:bg-success-hover hover:not-disabled:text-success-foreground',
      warning:
        'not-disabled:data-[state=on]:shadow-warning data-[state=on]:bg-warning data-[state=on]:text-warning-foreground hover:not-disabled:bg-warning-hover hover:not-disabled:text-warning-foreground',
      destructive:
        'not-disabled:data-[state=on]:shadow-destructive data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground hover:not-disabled:bg-destructive-hover hover:not-disabled:text-destructive-foreground',
      outline:
        'not-disabled:data-[state=on]:shadow-accent data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:not-disabled:bg-accent-hover hover:not-disabled:text-accent-foreground bg-background border-input border',
      ghost:
        'not-disabled:data-[state=on]:shadow-accent data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:not-disabled:bg-accent-hover hover:not-disabled:text-accent-foreground',
    },
  },
  defaultVariants: {
    icon: false,
    size: 'md',
    variant: 'default',
  },
  compoundVariants: [
    {
      className: 'w-7',
      icon: true,
      size: '2xs',
    },
    {
      className: 'w-8',
      icon: true,
      size: 'xs',
    },
    {
      className: 'w-9',
      icon: true,
      size: 'sm',
    },
    {
      className: 'w-10',
      icon: true,
      size: 'md',
    },
    {
      className: 'w-11',
      icon: true,
      size: 'lg',
    },
    {
      className: 'w-12',
      icon: true,
      size: 'xl',
    },
    {
      className: '[&>svg]:size-3',
      size: '2xs',
    },
    {
      className: '[&>svg]:size-3.5',
      size: 'xs',
    },
  ],
});

type ToggleVariantsProps = VariantProps<typeof toggleVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { ToggleVariantsProps };
export { toggleVariants };
