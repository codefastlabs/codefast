/** Renderer shapes derived from the slot fixtures, so a renamed slot fails at compile time. */
import type { compoundSlotsVariants } from "#/fixtures/compound-slots";
import type { extremeSlotsVariants } from "#/fixtures/extreme";
import type { slotsVariants } from "#/fixtures/slots";

type SlotCallable = () => string;

type SlotRenderers<Config extends { readonly slots: object }> = Readonly<Record<keyof Config["slots"], SlotCallable>>;

type Props = Readonly<Record<string, unknown>>;

/**
 * @since 0.3.16-canary.0
 */
export type ServicePreviewSlots = SlotRenderers<typeof slotsVariants>;

/**
 * @since 0.3.16-canary.0
 */
export type CompoundPaginationSlots = SlotRenderers<typeof compoundSlotsVariants>;

/**
 * @since 0.3.16-canary.0
 */
export type ExtremeDialogSlots = SlotRenderers<typeof extremeSlotsVariants>;

/**
 * A flat `tv` resolver as the benchmark loops call it.
 */
export type FlatRenderer = (props: Props) => string;

/**
 * A card-style slot resolver as the benchmark loops call it.
 */
export type CardRenderer = (props: Props) => ServicePreviewSlots;

/**
 * A pagination slot resolver as the benchmark loops call it.
 */
export type PaginationRenderer = (props: Props) => CompoundPaginationSlots;

/**
 * A dialog slot resolver as the benchmark loops call it.
 */
export type DialogRenderer = (props: Props) => ExtremeDialogSlots;
