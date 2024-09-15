import { tv, type VariantProps } from 'tailwind-variants';

const scrollAreaVariants = tv({
  slots: {
    root: 'relative overflow-hidden',
    viewport: 'size-full rounded-[inherit] [&>*]:h-full',
    scrollbar: 'flex touch-none select-none p-px transition',
  },
  variants: {
    orientation: {
      vertical: { scrollbar: 'h-full flex-row border-l border-l-transparent' },
      horizontal: { scrollbar: 'w-full flex-col border-t border-t-transparent' },
    },
    size: {
      none: '',
      sm: '',
      md: '',
      lg: '',
    },
  },
  compoundVariants: [
    { orientation: 'vertical', size: 'sm', className: { scrollbar: 'w-1.5' } },
    { orientation: 'vertical', size: 'md', className: { scrollbar: 'w-2' } },
    { orientation: 'vertical', size: 'lg', className: { scrollbar: 'w-2.5' } },
    { orientation: 'horizontal', size: 'sm', className: { scrollbar: 'h-1.5' } },
    { orientation: 'horizontal', size: 'md', className: { scrollbar: 'h-2' } },
    { orientation: 'horizontal', size: 'lg', className: { scrollbar: 'h-2.5' } },
  ],
  defaultVariants: {
    size: 'md',
  },
});

type ScrollAreaVariantsProps = VariantProps<typeof scrollAreaVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { scrollAreaVariants, type ScrollAreaVariantsProps };
