import { tv, type VariantProps } from 'tailwind-variants';

const selectVariants = tv({
  slots: {
    trigger: [
      'border-input flex w-full shrink-0 select-none items-center justify-between gap-2 whitespace-nowrap rounded-md border text-sm transition',
      '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:opacity-50',
      '[&_span]:truncate',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
    scrollButton: 'flex cursor-pointer items-center justify-center py-1',
    content: [
      'bg-popover text-popover-foreground relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border shadow-md',
      'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
      'data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=top]:slide-in-from-bottom-2',
      'data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2',
    ],
    viewport: 'p-1',
    label: 'px-2 py-1.5 text-sm font-semibold',
    item: [
      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm',
      'aria-disabled:pointer-events-none aria-disabled:opacity-50',
      'focus:bg-accent focus:text-accent-foreground focus:outline-none',
    ],
    indicator: ['absolute right-2 flex size-3.5 items-center justify-center', '[&_svg]:size-4'],
    separator: 'bg-border -mx-1 my-1 h-px',
  },
  variants: {
    size: {
      xxs: { trigger: 'h-7 px-2' },
      xs: { trigger: 'h-8 px-2' },
      sm: { trigger: 'h-9 px-3' },
      md: { trigger: 'h-10 px-3' },
      lg: { trigger: 'h-11 px-4' },
      xl: { trigger: 'h-12 px-4' },
    },
    position: {
      popper: {
        content:
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        viewport: 'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
      },
      'item-aligned': {},
    },
  },
  defaultVariants: {
    size: 'md',
    position: 'popper',
  },
});

type SelectVariantsProps = VariantProps<typeof selectVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { selectVariants, type SelectVariantsProps };
