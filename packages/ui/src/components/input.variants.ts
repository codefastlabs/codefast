import { tv } from "@codefast/tailwind-variants";

/* -----------------------------------------------------------------------------
 * Variant: Input
 * -------------------------------------------------------------------------- */

const inputVariants = tv({
  slots: {
    input:
      "placeholder:text-muted-foreground outline-hidden file:py-1.75 size-full file:bg-transparent file:font-medium",
    root: "border-input not-has-disabled:shadow-xs hover:not-has-disabled:not-focus-within:border-ring/60 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-3 has-disabled:opacity-50 [&>svg]:text-muted-foreground has-aria-invalid:border-destructive hover:not-has-disabled:not-focus-within:has-aria-invalid:border-destructive/60 focus-within:has-aria-invalid:ring-destructive/20 dark:focus-within:has-aria-invalid:ring-destructive/40 dark:bg-input/30 peer flex h-9 w-full grow items-center gap-3 rounded-lg border px-3 text-base transition md:text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  },
});

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { inputVariants };
