import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

const buttonVariants = tv({
  base: 'not-disabled:shadow-xs focus-visible:ring-ring focus-visible:ring-3 inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium focus-visible:outline-none disabled:opacity-50 [&>svg]:shrink-0',
  variants: {
    icon: {
      false: '',
      true: 'px-0',
    },
    inside: {
      false: '',
      true: '',
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
      default: 'bg-primary text-primary-foreground not-disabled:shadow-primary hover:not-disabled:bg-primary-hover',
      secondary:
        'bg-secondary text-secondary-foreground not-disabled:shadow-secondary hover:not-disabled:bg-secondary-hover',
      info: 'bg-info text-info-foreground not-disabled:shadow-info hover:not-disabled:bg-info-hover',
      success: 'bg-success text-success-foreground not-disabled:shadow-success hover:not-disabled:bg-success-hover',
      warning: 'bg-warning text-warning-foreground not-disabled:shadow-warning hover:not-disabled:bg-warning-hover',
      destructive:
        'bg-destructive text-destructive-foreground not-disabled:shadow-destructive hover:not-disabled:bg-destructive-hover',
      outline:
        'border-input not-disabled:shadow-input hover:not-disabled:hover:not-disabled:bg-accent hover:not-disabled:text-accent-foreground focus-visible:border-input-focus border',
      ghost: 'not-disabled:shadow-none hover:not-disabled:bg-accent hover:not-disabled:text-accent-foreground',
      link: 'not-disabled:shadow-none text-primary hover:not-disabled:underline underline-offset-4',
    },
  },
  defaultVariants: {
    icon: false,
    inside: false,
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
      className: 'h-6',
      inside: true,
      size: '2xs',
    },
    {
      className: 'h-6',
      inside: true,
      size: 'xs',
    },
    {
      className: 'h-7',
      inside: true,
      size: 'sm',
    },
    {
      className: 'h-8',
      inside: true,
      size: 'md',
    },
    {
      className: 'h-9',
      inside: true,
      size: 'lg',
    },
    {
      className: 'h-10',
      inside: true,
      size: 'xl',
    },
    {
      className: 'w-6',
      icon: true,
      inside: true,
      size: '2xs',
    },
    {
      className: 'w-6',
      icon: true,
      inside: true,
      size: 'xs',
    },
    {
      className: 'w-7',
      icon: true,
      inside: true,
      size: 'sm',
    },
    {
      className: 'w-8',
      icon: true,
      inside: true,
      size: 'md',
    },
    {
      className: 'w-9',
      icon: true,
      inside: true,
      size: 'lg',
    },
    {
      className: 'w-10',
      icon: true,
      inside: true,
      size: 'xl',
    },
  ],
});

type ButtonVariantsProps = VariantProps<typeof buttonVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { ButtonVariantsProps };
export { buttonVariants };
