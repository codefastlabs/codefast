import { tv } from "@codefast/tailwind-variants";
import type { VariantProps } from "@codefast/tailwind-variants";
import type { ComponentProps, ReactElement } from "react";

// A component styled entirely with @codefast/tailwind-variants `tv()`: a single source of
// truth for the base classes plus a typed `tone`/`emphasis` matrix. `VariantProps` derives
// the prop types from this config, so the variants stay in sync with the component API.
const callout = tv({
  base: "rounded-lg border p-4 text-sm",
  variants: {
    tone: {
      info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
      success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      danger: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    },
    emphasis: {
      subtle: "",
      strong: "font-medium shadow-sm",
    },
  },
});

type CalloutProps = ComponentProps<"div"> & VariantProps<typeof callout>;

// `tone`/`emphasis` are defaulted here (rather than via tv's `defaultVariants`) so the resolver
// never receives an explicit `undefined` — the app runs with `exactOptionalPropertyTypes`.
export function Callout({ className, tone = "info", emphasis = "subtle", ...props }: CalloutProps): ReactElement {
  return <div className={callout({ tone, emphasis, className })} {...props} />;
}
