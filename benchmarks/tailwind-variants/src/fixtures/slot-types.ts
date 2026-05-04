/**
 * Slot renderers returned by `tv()` when using `slots`.
 * Library overloads can resolve to `string` here; assertions keep benchmarks typed.
 *
 * @since 0.3.16-canary.0
 */
export type SlotCallable = () => string;

/**
 * @since 0.3.16-canary.0
 */
export type ServicePreviewSlots = {
  base: SlotCallable;
  content: SlotCallable;
  description: SlotCallable;
  footer: SlotCallable;
  header: SlotCallable;
  title: SlotCallable;
};

/**
 * @since 0.3.16-canary.0
 */
export type CompoundPaginationSlots = {
  base: SlotCallable;
  cursor: SlotCallable;
  item: SlotCallable;
  next: SlotCallable;
  prev: SlotCallable;
};

/**
 * @since 0.3.16-canary.0
 */
export type ExtremeDialogSlots = {
  action: SlotCallable;
  badge: SlotCallable;
  close: SlotCallable;
  content: SlotCallable;
  description: SlotCallable;
  footer: SlotCallable;
  header: SlotCallable;
  icon: SlotCallable;
  overlay: SlotCallable;
  separator: SlotCallable;
  title: SlotCallable;
  trigger: SlotCallable;
};
