/**
 * Slot renderers returned by `tv()` when using `slots`.
 * Library overloads can resolve to `string` here; assertions keep benchmarks typed.
 */
export type SlotCallable = () => string;

export type ServicePreviewSlots = {
  base: SlotCallable;
  content: SlotCallable;
  description: SlotCallable;
  footer: SlotCallable;
  header: SlotCallable;
  title: SlotCallable;
};

export type CompoundPaginationSlots = {
  base: SlotCallable;
  cursor: SlotCallable;
  item: SlotCallable;
  next: SlotCallable;
  prev: SlotCallable;
};

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
