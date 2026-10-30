/**
 * `cn()` calls shaped like a component library's own: a long static class list, sometimes a condition, and the
 * caller's `className`, which is usually absent.
 */

const PANEL =
  "fixed inset-0 z-50 flex max-h-[calc(100dvh-2rem)] w-full flex-col gap-4 overflow-y-auto rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10 outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0";
const FIELD =
  "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm";
const ITEM =
  "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50";
const LABEL = "flex items-center gap-2 text-sm leading-none font-medium select-none";

/**
 * The arguments of each `cn()` call one timed iteration makes, in order.
 */
export const cnTestCalls: ReadonlyArray<ReadonlyArray<unknown>> = [
  [PANEL, undefined],
  [FIELD, undefined],
  [ITEM, undefined],
  [LABEL, undefined],
  [PANEL, "max-w-lg"],
  [FIELD, "h-11 px-4"],
  [ITEM, "ps-8"],
  [LABEL, "text-xs"],
  [ITEM, "bg-accent", undefined],
  [ITEM, false, "rounded-md"],
  [FIELD, { "border-destructive": true }, undefined],
  [LABEL, ["gap-1", undefined], "sr-only"],
];
