import { tv, type VariantProps } from 'tailwind-variants';

const dropdownMenuVariants = tv({
  slots: {
    subTrigger:
      'focus:bg-accent data-[state=open]:bg-accent flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm focus:outline-none',
    subContent:
      'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 z-50 min-w-32 rounded-md border p-1 shadow-md',
    content:
      'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 z-50 min-w-32 rounded-md border p-1 shadow-md',
    item: 'focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm transition focus:outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50',
    checkboxItem:
      'focus:bg-accent focus:text-accent-foreground relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm transition focus:outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50',
    itemIndicator: 'absolute left-2 flex size-3.5 items-center justify-center',
    label: 'px-2 py-1.5 text-sm font-semibold',
    separator: 'bg-border -mx-1 my-1 h-px',
    shortcut: 'ml-auto text-xs tracking-widest opacity-60',
  },
  variants: {
    inset: {
      true: {
        subTrigger: 'pl-8',
        item: 'pl-8',
        label: 'pl-8',
      },
    },
  },
});

type DropdownMenuVariantsProps = VariantProps<typeof dropdownMenuVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { dropdownMenuVariants, type DropdownMenuVariantsProps };
