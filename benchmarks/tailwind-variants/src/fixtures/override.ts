/**
 * Button selections from different call sites, each passing its own `className` — absent, additive, or one that
 * conflicts with a class the variants set, so the merge decides the answer.
 */

/**
 * The selections one timed iteration renders, one per call site.
 *
 * @since 0.11.1
 */
export const overrideTestProps: ReadonlyArray<Readonly<Record<string, string | undefined>>> = [
  { className: undefined, variant: "outline" },
  { className: "px-6", size: "sm" },
  { className: "h-12 rounded-full", size: "lg", variant: "secondary" },
  { className: "bg-red-500 text-white", variant: "destructive" },
  { className: "w-full justify-start", variant: "ghost" },
  { className: undefined, size: "icon", variant: "ghost" },
  { className: "ms-auto", size: "sm", variant: "link" },
  { className: "text-base font-semibold", variant: "default" },
  { className: "shadow-none", shadow: "lg", variant: "outline" },
  { className: "rounded-none", rounded: "full", size: "xs" },
  { className: "gap-1 px-2", size: "sm", variant: "secondary" },
  { className: "animate-none", animation: "spin", variant: "info" },
];
