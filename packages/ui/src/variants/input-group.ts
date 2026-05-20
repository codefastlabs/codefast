import type { VariantProps } from "#/lib/utils";

import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: InputGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const inputGroupVariants = tv({
  base: [
    "group/input-group relative flex h-9 w-full min-w-0 items-center",
    "rounded-lg border border-input shadow-xs outline-none",
    "transition-[color,box-shadow]",
    "dark:bg-input/30",
    "has-[>textarea]:h-auto",
    "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col",
    "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col",
    "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50",
    "has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-destructive/20",
    "dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40",
    "has-[>[data-align=block-end]]:[&>[data-slot=input-group-control]]:pt-3",
    "has-[>[data-align=block-start]]:[&>[data-slot=input-group-control]]:pb-3",
    "has-[>[data-align=inline-end]]:[&>[data-slot=input-group-control]]:pr-2",
    "has-[>[data-align=inline-start]]:[&>[data-slot=input-group-control]]:pl-2",
  ],
});

/* -----------------------------------------------------------------------------
 * Variant: InputGroupAddon
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const inputGroupAddonVariants = tv({
  base: [
    "flex h-auto items-center justify-center gap-2 py-1.5",
    "text-sm font-medium text-muted-foreground",
    "cursor-text select-none",
    "group-data-disabled/input-group:opacity-50",
    "[&>kbd]:rounded-[calc(var(--radius)-5px)]",
    "[&>svg:not([class*='size-'])]:size-4",
  ],
  defaultVariants: {
    align: "inline-start",
  },
  variants: {
    align: {
      "block-end": [
        "order-last w-full justify-start px-3 pb-3",
        "group-has-[>input]/input-group:pb-2.5",
        "[.border-t]:pt-3",
      ],
      "block-start": [
        "order-first w-full justify-start px-3 pt-3",
        "group-has-[>input]/input-group:pt-2.5",
        "[.border-b]:pb-3",
      ],
      "inline-end": [
        "order-last",
        "pr-3",
        "has-[>button]:mr-[-0.45rem]",
        "has-[>kbd]:mr-[-0.35rem]",
      ],
      "inline-start": [
        "order-first",
        "pl-3",
        "has-[>button]:ml-[-0.45rem]",
        "has-[>kbd]:ml-[-0.35rem]",
      ],
    },
  },
});

/* -----------------------------------------------------------------------------
 * Variant: InputGroupButton
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const inputGroupButtonVariants = tv({
  base: [
    "flex items-center gap-2",
    "shadow-none",
    "text-sm",
    "[&>svg:not([class*='size-'])]:size-4",
  ],
  defaultVariants: {
    size: "xs",
  },
  variants: {
    size: {
      "icon-xs": ["size-6 p-0", "rounded-[calc(var(--radius)-5px)]", "has-[>svg]:p-0"],
      "icon-sm": ["size-8 p-0", "has-[>svg]:p-0"],

      xs: [
        "h-6 gap-1 px-2",
        "rounded-[calc(var(--radius)-5px)]",
        "has-[>svg]:px-2",
        "[&>svg]:size-3.5",
      ],
      sm: ["h-8 gap-1.5 px-2.5", "rounded-md", "has-[>svg]:px-2.5"],
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type InputGroupVariants = VariantProps<typeof inputGroupVariants>;

/**
 * @since 0.3.16-canary.0
 */
type InputGroupAddonVariants = VariantProps<typeof inputGroupAddonVariants>;

/**
 * @since 0.3.16-canary.0
 */
type InputGroupButtonVariants = VariantProps<typeof inputGroupButtonVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { inputGroupAddonVariants, inputGroupButtonVariants, inputGroupVariants };
export type { InputGroupAddonVariants, InputGroupButtonVariants, InputGroupVariants };
