import type { VariantProps } from "#/lib/utils";
import { tv } from "#/lib/utils";

/* -----------------------------------------------------------------------------
 * Variant: InputNumber
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const inputNumberVariants = tv({
  defaultVariants: {
    variant: "stepper",
  },
  slots: {
    /**
     * Split layout: trailing increment button (always on the inline end).
     */
    incrementButton:
      "order-last h-full w-9 shrink-0 rounded-none rounded-e-[calc(var(--radius-md)-1px)] border-s border-s-input text-muted-foreground group-focus-within/input-number:border-s-ring group-has-aria-invalid/input-number:border-s-destructive focus-visible:bg-ring/50 focus-visible:ring-0 group-has-aria-invalid/input-number:focus-visible:bg-destructive/20 dark:group-has-aria-invalid/input-number:focus-visible:bg-destructive/40",
    /**
     * Split layout: leading decrement button (always on the inline start).
     */
    decrementButton:
      "order-first h-full w-9 shrink-0 rounded-none rounded-s-[calc(var(--radius-md)-1px)] border-e border-e-input text-muted-foreground group-focus-within/input-number:border-e-ring group-has-aria-invalid/input-number:border-e-destructive focus-visible:bg-ring/50 focus-visible:ring-0 group-has-aria-invalid/input-number:focus-visible:bg-destructive/20 dark:group-has-aria-invalid/input-number:focus-visible:bg-destructive/40",
    /**
     * Editable numeric input.
     */
    field:
      "h-full min-w-0 flex-1 bg-transparent px-2.5 py-1 outline-hidden selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed",
    /**
     * Outer container.
     */
    root: "group/input-number relative flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border border-input bg-transparent text-base transition-[color,box-shadow] not-has-disabled:shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-disabled:opacity-50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 motion-reduce:transition-none md:text-sm dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    /**
     * Stepper layout: stacked chevron column on the trailing edge.
     */
    stepper:
      "order-last grid h-full w-8 shrink-0 divide-y divide-input border-s border-s-input transition-colors group-focus-within/input-number:divide-ring group-focus-within/input-number:border-s-ring group-has-aria-invalid/input-number:divide-destructive group-has-aria-invalid/input-number:border-s-destructive motion-reduce:transition-none *:[button]:focus-visible:bg-ring/50 *:[button]:focus-visible:ring-0 group-has-aria-invalid/input-number:*:[button]:focus-visible:bg-destructive/20 dark:group-has-aria-invalid/input-number:*:[button]:focus-visible:bg-destructive/40",
    /**
     * Stepper layout: individual chevron button (shared by increment/decrement).
     */
    stepperButton: "h-auto min-w-0 rounded-none px-0 text-muted-foreground",
  },
  variants: {
    variant: {
      split: {
        field: "text-center tabular-nums",
      },
      stepper: {},
    },
  },
});

/**
 * @since 0.3.16-canary.0
 */
type InputNumberVariants = VariantProps<typeof inputNumberVariants>;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { inputNumberVariants };
export type { InputNumberVariants };
