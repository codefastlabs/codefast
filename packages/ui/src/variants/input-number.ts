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
    incrementButton: [
      "order-last h-full w-9 shrink-0",
      "rounded-none rounded-r-[calc(var(--radius-lg)-1px)] border-l border-input",
      "text-muted-foreground",
      "focus-visible:bg-ring/50 focus-visible:ring-0",
      "group-focus-within/input-number:border-l-ring",
      "group-has-aria-invalid/input-number:border-l-destructive",
      "group-has-aria-invalid/input-number:focus-visible:bg-destructive/20",
      "dark:group-has-aria-invalid/input-number:focus-visible:bg-destructive/40",
    ],
    /**
     * Split layout: leading decrement button (always on the inline start).
     */
    decrementButton: [
      "order-first h-full w-9 shrink-0",
      "rounded-none rounded-l-[calc(var(--radius-lg)-1px)] border-r border-input",
      "text-muted-foreground",
      "focus-visible:bg-ring/50 focus-visible:ring-0",
      "group-focus-within/input-number:border-r-ring",
      "group-has-aria-invalid/input-number:border-r-destructive",
      "group-has-aria-invalid/input-number:focus-visible:bg-destructive/20",
      "dark:group-has-aria-invalid/input-number:focus-visible:bg-destructive/40",
    ],
    /**
     * Editable numeric input.
     */
    field: [
      "h-full min-w-0 flex-1 px-3 py-1",
      "bg-transparent outline-none",
      "selection:bg-primary selection:text-primary-foreground",
      "placeholder:text-muted-foreground",
      "disabled:pointer-events-none disabled:cursor-not-allowed",
    ],
    /**
     * Outer container.
     */
    root: [
      "group/input-number relative flex h-9 w-full min-w-0 items-center overflow-hidden",
      "rounded-lg border border-input",
      "bg-transparent text-base",
      "transition-[color,box-shadow]",
      "motion-reduce:transition-none",
      "not-has-disabled:shadow-xs",
      "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
      "hover:not-has-disabled:not-focus-within:border-ring/60",
      "focus-within:has-aria-invalid:ring-destructive/20",
      "hover:not-has-disabled:not-focus-within:has-aria-invalid:border-destructive/60",
      "md:text-sm",
      "dark:bg-input/30",
      "dark:focus-within:has-aria-invalid:ring-destructive/40",
      "has-disabled:opacity-50",
      "has-aria-invalid:border-destructive",
      "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    ],
    /**
     * Stepper layout: stacked chevron column on the trailing edge.
     */
    stepper: [
      "order-last grid h-full w-8 shrink-0",
      "divide-y divide-input border-l border-l-input",
      "transition-colors",
      "motion-reduce:transition-none",
      "group-focus-within/input-number:divide-ring group-focus-within/input-number:border-l-ring",
      "group-has-aria-invalid/input-number:divide-destructive group-has-aria-invalid/input-number:border-l-destructive",
      "group-has-aria-invalid/input-number:*:[button]:focus-visible:bg-destructive/20",
      "dark:group-has-aria-invalid/input-number:*:[button]:focus-visible:bg-destructive/40",
      "*:[button]:focus-visible:bg-ring/50 *:[button]:focus-visible:ring-0",
    ],
    /**
     * Stepper layout: individual chevron button (shared by increment/decrement).
     */
    stepperButton: ["h-auto min-w-0 px-0", "rounded-none", "text-muted-foreground"],
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
