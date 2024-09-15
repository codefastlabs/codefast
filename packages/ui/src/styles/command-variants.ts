import { tv, type VariantProps } from 'tailwind-variants';

const commandVariants = tv({
  slots: {
    root: 'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
    dialog:
      '[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:size-5',
    inputWrapper: 'flex items-center gap-2 border-b px-3',
    inputIcon: 'size-5 shrink-0 opacity-50',
    input:
      'placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent text-sm outline-none disabled:cursor-default disabled:opacity-50',
    list: 'max-h-72 overflow-y-auto overflow-x-hidden',
    empty: 'py-6 text-center text-sm',
    group:
      'text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
    separator: 'bg-border -mx-1 h-px',
    item: 'aria-selected:bg-accent aria-selected:text-accent-foreground relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-selected:outline-none',
    loading: 'flex justify-center p-2',
    shortcut: 'text-muted-foreground ml-auto text-xs tracking-widest',
  },
});

type CommandVariantsProps = VariantProps<typeof commandVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { commandVariants, type CommandVariantsProps };
