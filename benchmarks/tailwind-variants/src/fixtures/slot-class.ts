/**
 * Card renders whose sub-components each call their slot with the `className` they were given, which is usually
 * absent and sometimes overrides a class the slot sets.
 */

type SlotClasses = Readonly<
  Partial<Record<"base" | "content" | "description" | "footer" | "header" | "title", string>>
>;

/**
 * One card render: the selection, then the `className` each rendered slot receives.
 *
 * @since 0.11.1
 */
export interface SlotClassCall {
  readonly classes: SlotClasses;
  readonly props: Readonly<Record<string, string>>;
}

/**
 * The card renders one timed iteration makes.
 *
 * @since 0.11.1
 */
export const slotClassTestCalls: ReadonlyArray<SlotClassCall> = [
  { classes: {}, props: {} },
  { classes: {}, props: { variant: "destructive" } },
  { classes: { base: "max-w-sm" }, props: { size: "lg", variant: "success" } },
  { classes: {}, props: { size: "sm" } },
  { classes: { title: "text-lg" }, props: { size: "sm", variant: "destructive" } },
  { classes: {}, props: { elevation: "lg", rounded: "xl", size: "xs", variant: "warning" } },
  { classes: { content: "p-4 pt-0" }, props: { animation: "scale", elevation: "2xl", size: "xl", variant: "info" } },
  { classes: {}, props: { animation: "pulse", rounded: "3xl", variant: "gradient" } },
  { classes: { footer: "justify-end" }, props: { animation: "fade", elevation: "xl", size: "sm", variant: "glass" } },
  { classes: {}, props: { animation: "bounce", elevation: "inner", rounded: "none", variant: "success" } },
  { classes: { base: "border-0 shadow-none" }, props: { size: "lg", variant: "warning" } },
  { classes: {}, props: { size: "md", variant: "info" } },
];
