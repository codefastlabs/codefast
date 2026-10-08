/**
 * The props that carry a part's `data-slot`.
 */
type BehaviorSlotProps = { readonly "data-slot"?: string };

/**
 * Returns a behavior-only part's `data-slot` props, empty under `asChild` so the composed element keeps its own.
 *
 * @remarks The key is omitted rather than `undefined`, which `Slot` would forward over the child's slot.
 */
export function behaviorSlot(slot: string, asChild: boolean | undefined): BehaviorSlotProps {
  return asChild ? {} : { "data-slot": slot };
}
