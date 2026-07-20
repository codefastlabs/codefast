import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: InputGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const inputGroupVariants = tv({
  base: "group/input-group relative flex h-8 w-full min-w-0 items-center rounded-lg border border-input shadow-xs transition-[color,box-shadow] outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:bg-input/50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:bg-input/30 dark:has-disabled:bg-input/80 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pe-1.5 has-[>[data-align=inline-start]]:[&>input]:ps-1.5",
});

/* -----------------------------------------------------------------------------
 * Variant: InputGroupAddon
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const inputGroupAddonVariants = tv({
  base: "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-disabled/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-3px)] [&>svg:not([class*='size-'])]:size-4",
  defaultVariants: {
    align: "inline-start",
  },
  variants: {
    align: {
      "block-end": "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      "block-start":
        "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
      "inline-end": "order-last pe-2 has-[>button]:me-[-0.3rem] has-[>kbd]:me-[-0.15rem]",
      "inline-start": "order-first ps-2 has-[>button]:ms-[-0.3rem] has-[>kbd]:ms-[-0.15rem]",
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
  base: "flex items-center gap-2 text-sm shadow-none",
  defaultVariants: {
    size: "xs",
  },
  variants: {
    size: {
      "icon-xs": "size-6 rounded-[calc(var(--radius)-3px)] p-0 has-[>svg]:p-0",
      "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      sm: "",
      xs: "h-6 gap-1 rounded-[calc(var(--radius)-3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
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
