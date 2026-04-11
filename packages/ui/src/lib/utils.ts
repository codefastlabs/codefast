import { createTV } from "@codefast/tailwind-variants";
import type { VariantProps } from "@codefast/tailwind-variants";

/**
 * Shared Tailwind Variants factory for `@codefast/ui`.
 * Use these `cn` / `tv` helpers everywhere in this package so class merging stays consistent
 * and optional `twMergeConfig` can be applied in one place later.
 */
const { cn, tv } = createTV({
  twMerge: true,
});

export { cn, tv };
export type { VariantProps };
