/** The slot calls every side makes per render, so both libraries do the same work under one scenario id. */
import type { CompoundPaginationSlots, ExtremeDialogSlots, ServicePreviewSlots } from "#/fixtures/slot-types";

/**
 * Renders the card slots a service preview shows.
 */
export function renderCardSlots(slots: ServicePreviewSlots): void {
  slots.base();
  slots.header();
  slots.content();
  slots.footer();
  slots.title();
  slots.description();
}

/**
 * Renders the pagination slots a page control shows.
 */
export function renderPaginationSlots(slots: CompoundPaginationSlots): void {
  slots.base();
  slots.item();
  slots.prev();
  slots.next();
  slots.cursor();
}

/**
 * Renders every dialog slot.
 */
export function renderDialogSlots(slots: ExtremeDialogSlots): void {
  slots.trigger();
  slots.content();
  slots.header();
  slots.footer();
  slots.title();
  slots.description();
  slots.action();
  slots.icon();
  slots.overlay();
  slots.close();
  slots.separator();
  slots.badge();
}

/**
 * Renders every slot once and returns the total class length, so nothing the definition produced can be elided.
 */
export function renderEverySlot(slots: Readonly<Record<string, () => string>>): number {
  let length = 0;

  for (const key in slots) {
    const render = slots[key];

    if (render !== undefined) {
      length += render().length;
    }
  }

  return length;
}
