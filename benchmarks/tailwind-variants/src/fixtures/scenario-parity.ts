import { cnTestCalls } from "#fixtures/cn";
/** Scenario descriptors every side spreads, so a row's id, group, description, and batch cannot drift. */
import { complexTestProps } from "#fixtures/complex";
import { compoundSlotsTestProps } from "#fixtures/compound-slots";
import { simpleTestProps as createTvTestProps } from "#fixtures/create-tv";
import { DATA_CELLS_PER_ITERATION } from "#fixtures/data-cells";
import { extendsTestProps } from "#fixtures/extends";
import { extremeSlotsTestProps, extremeTestProps } from "#fixtures/extreme";
import { uniqueClassSelections } from "#fixtures/novel-classes";
import { overrideTestProps } from "#fixtures/override";
import { repeatSimpleTestProps, repeatSlotsTestProps } from "#fixtures/repeat";
import { simpleTestProps } from "#fixtures/simple";
import { slotClassTestCalls } from "#fixtures/slot-class";
import { slotsTestProps } from "#fixtures/slots";
import { wideSlotsTestProps } from "#fixtures/wide-slots";
import type { BenchScenario } from "#scenarios/types";

type ScenarioDescriptor = Pick<BenchScenario, "id" | "group" | "what"> &
  Partial<Pick<BenchScenario, "batch" | "excludeFromAggregates" | "comparesWithin">>;

/**
 * Component definitions per timed iteration of a cold row, so every side's loop bound and batch agree.
 *
 * @since 0.7.3
 */
export const COLD_DEFINITIONS_PER_LOOP = 12;

/**
 * @since 0.5.0-canary.7
 */
export const SIMPLE_WITHOUT_MERGE = {
  id: "simple-without-merge",
  group: "simple",
  what: "Simple button variants without tailwind-merge",
  batch: simpleTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const SIMPLE_WITH_MERGE = {
  id: "simple-with-merge",
  comparesWithin: "simple-without-merge",
  group: "simple",
  what: "Simple button variants with tailwind-merge on tv",
  batch: simpleTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const COMPLEX_WITHOUT_MERGE = {
  id: "complex-without-merge",
  group: "complex",
  what: "Complex variants (compounds, booleans) without tailwind-merge",
  batch: complexTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const COMPLEX_WITH_MERGE = {
  id: "complex-with-merge",
  comparesWithin: "complex-without-merge",
  group: "complex",
  what: "Complex variants with tailwind-merge on tv",
  batch: complexTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const SLOTS_WITHOUT_MERGE = {
  id: "slots-without-merge",
  group: "slots",
  what: "Slots (card-style) without tailwind-merge",
  batch: slotsTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const SLOTS_WITH_MERGE = {
  id: "slots-with-merge",
  comparesWithin: "slots-without-merge",
  group: "slots",
  what: "Slots with tailwind-merge on tv",
  batch: slotsTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const COMPOUND_SLOTS_WITHOUT_MERGE = {
  id: "compound-slots-without-merge",
  group: "compound-slots",
  what: "Compound slots (pagination-style) without tailwind-merge",
  batch: compoundSlotsTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const COMPOUND_SLOTS_WITH_MERGE = {
  id: "compound-slots-with-merge",
  comparesWithin: "compound-slots-without-merge",
  group: "compound-slots",
  what: "Compound slots with tailwind-merge on tv",
  batch: compoundSlotsTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTENDS_WITHOUT_MERGE = {
  id: "extends-without-merge",
  group: "extends",
  what: "Extended tv config without tailwind-merge",
  batch: extendsTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTENDS_WITH_MERGE = {
  id: "extends-with-merge",
  comparesWithin: "extends-without-merge",
  group: "extends",
  what: "Extended tv config with tailwind-merge on tv",
  batch: extendsTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const CREATE_TV_WITHOUT_MERGE = {
  id: "create-tv-without-merge",
  group: "create-tv",
  what: "Resolver from the createTV factory without tailwind-merge; the factory call sits outside the timed loop",
  batch: createTvTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const CREATE_TV_WITH_MERGE = {
  id: "create-tv-with-merge",
  comparesWithin: "create-tv-without-merge",
  group: "create-tv",
  what: "Resolver from the createTV factory with tailwind-merge; the factory call sits outside the timed loop",
  batch: createTvTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTREME_WITHOUT_MERGE = {
  id: "extreme-without-merge",
  group: "extreme",
  what: "Large variant matrix without tailwind-merge",
  batch: extremeTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTREME_WITH_MERGE = {
  id: "extreme-with-merge",
  comparesWithin: "extreme-without-merge",
  group: "extreme",
  what: "Large variant matrix with tailwind-merge on tv",
  batch: extremeTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTREME_SLOTS_WITHOUT_MERGE = {
  id: "extreme-slots-without-merge",
  group: "extreme-slots",
  what: "Many slots without tailwind-merge",
  batch: extremeSlotsTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTREME_SLOTS_WITH_MERGE = {
  id: "extreme-slots-with-merge",
  comparesWithin: "extreme-slots-without-merge",
  group: "extreme-slots",
  what: "Many slots with tailwind-merge on tv",
  batch: extremeSlotsTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.6.0
 */
export const REPEAT_SIMPLE_WITHOUT_MERGE = {
  id: "repeat-simple-without-merge",
  group: "repeat-simple",
  what: "Simple button variants, 3 selections repeated, without tailwind-merge",
  batch: repeatSimpleTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.6.0
 */
export const REPEAT_SIMPLE_WITH_MERGE = {
  id: "repeat-simple-with-merge",
  comparesWithin: "repeat-simple-without-merge",
  group: "repeat-simple",
  what: "Simple button variants, 3 selections repeated, with tailwind-merge on tv",
  batch: repeatSimpleTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.6.0
 */
export const REPEAT_SLOTS_WITHOUT_MERGE = {
  id: "repeat-slots-without-merge",
  group: "repeat-slots",
  what: "Slots, 3 selections repeated, without tailwind-merge",
  batch: repeatSlotsTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.6.0
 */
export const REPEAT_SLOTS_WITH_MERGE = {
  id: "repeat-slots-with-merge",
  comparesWithin: "repeat-slots-without-merge",
  group: "repeat-slots",
  what: "Slots, 3 selections repeated, with tailwind-merge on tv",
  batch: repeatSlotsTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.6.0
 */
export const UNCACHED_SIMPLE_WITH_MERGE = {
  id: "uncached-simple-with-merge",
  comparesWithin: "uncached-simple-without-merge",
  group: "simple",
  what: "Control, not a comparison: simple variants with the resolution and merge caches off, so the plan walk and the merge stay measured",
  batch: simpleTestProps.length,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.6.0
 */
export const UNCACHED_SLOTS_WITH_MERGE = {
  id: "uncached-slots-with-merge",
  comparesWithin: "uncached-slots-without-merge",
  group: "slots",
  what: "Control, not a comparison: slots with the resolution and merge caches off, so the plan walk and the merge stay measured",
  batch: slotsTestProps.length,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * The without-merge control for simple variants, paired with its with-merge row to isolate the merge step.
 *
 * @since 0.7.3
 */
export const UNCACHED_SIMPLE_WITHOUT_MERGE = {
  id: "uncached-simple-without-merge",
  group: "simple",
  what: "Control, not a comparison: simple variants with the resolution cache and tailwind-merge off; its delta from the with-merge row is the merge step",
  batch: simpleTestProps.length,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * The without-merge control for slots, paired with its with-merge row to isolate the merge step.
 *
 * @since 0.7.3
 */
export const UNCACHED_SLOTS_WITHOUT_MERGE = {
  id: "uncached-slots-without-merge",
  group: "slots",
  what: "Control, not a comparison: slots with the resolution cache and tailwind-merge off; its delta from the with-merge row is the merge step",
  batch: slotsTestProps.length,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * Defining a button without rendering it: an eager library compiles here, a lazy one on its first render.
 *
 * @since 0.7.3
 */
export const DEFINE_ONLY_SIMPLE = {
  id: "define-only-simple",
  group: "define-only",
  what: "Define a button component without rendering it (an eager library compiles here, a lazy one on first render — off the aggregates)",
  batch: COLD_DEFINITIONS_PER_LOOP,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * Defining a slot component without rendering it: an eager library compiles here, a lazy one on its first render.
 *
 * @since 0.7.3
 */
export const DEFINE_ONLY_SLOTS = {
  id: "define-only-slots",
  group: "define-only",
  what: "Define a slot component without rendering it (an eager library compiles here, a lazy one on first render — off the aggregates)",
  batch: COLD_DEFINITIONS_PER_LOOP,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * Defining a button and rendering it once; minus the define-only row, the first render alone.
 *
 * @since 0.7.3
 */
export const FIRST_RENDER_SIMPLE = {
  id: "first-render-simple",
  group: "first-render",
  what: "Define a button component and render it once (per definition, not per render; minus define-only it is the first render — off the aggregates)",
  batch: COLD_DEFINITIONS_PER_LOOP,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * Defining a slot component and rendering every slot once; minus the define-only row, the first render alone.
 *
 * @since 0.7.3
 */
export const FIRST_RENDER_SLOTS = {
  id: "first-render-slots",
  group: "first-render",
  what: "Define a slot component and render every slot once (per definition, not per render; minus define-only it is the first render — off the aggregates)",
  batch: COLD_DEFINITIONS_PER_LOOP,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/** `cn()` with a long static class list and the caller's usually absent `className`, the call a component makes most. */
export const CN_WITH_MERGE = {
  id: "cn-with-merge",
  group: "cn",
  what: "cn() calls shaped like a component library's: a static class list, a condition, the caller's className",
  batch: cnTestCalls.length,
} as const satisfies ScenarioDescriptor;

/** A button rendered from many call sites, each with its own `className`, some of which conflict with a variant. */
export const OVERRIDE_WITH_MERGE = {
  id: "override-with-merge",
  group: "override",
  what: "Button variants from many call sites, each passing its own className, some conflicting with a variant",
  batch: overrideTestProps.length,
} as const satisfies ScenarioDescriptor;

/** A card whose sub-components each call their slot with the `className` they were given, usually absent. */
export const SLOT_CLASS_WITH_MERGE = {
  id: "slot-class-with-merge",
  group: "slot-class",
  what: "Card slots each called with their own className, usually absent, sometimes overriding a slot class",
  batch: slotClassTestCalls.length,
} as const satisfies ScenarioDescriptor;

/** One button from many call sites, each passing a `className` no call passed before, so every merge is a miss. */
export const UNIQUE_CLASS_WITH_MERGE = {
  id: "unique-class-with-merge",
  group: "unique-class",
  what: "Button variants from many call sites, each with a className no earlier call passed, so the merge never hits a cache",
  batch: uniqueClassSelections.length,
} as const satisfies ScenarioDescriptor;

/** A button whose definition carries a class of its own, rendered once, so its merge starts cold. */
export const FIRST_RENDER_COLD_SIMPLE = {
  id: "first-render-cold-simple",
  group: "first-render",
  what: "Define a button carrying a class of its own and render it once, every merge a miss (per definition — off the aggregates)",
  batch: COLD_DEFINITIONS_PER_LOOP,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/** A slot component whose base slot carries a class of its own, every slot rendered once. */
export const FIRST_RENDER_COLD_SLOTS = {
  id: "first-render-cold-slots",
  group: "first-render",
  what: "Define a slot component carrying a class of its own and render every slot once, every merge a miss (per definition — off the aggregates)",
  batch: COLD_DEFINITIONS_PER_LOOP,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/** Table cells whose selection comes from row data and whose `className` comes from the column, about a thousand distinct calls. */
export const DATA_CELLS_WITH_MERGE = {
  id: "data-cells-with-merge",
  group: "data-cells",
  what: "Table cells keyed by row status and column, drawn from about a thousand distinct calls",
  batch: DATA_CELLS_PER_ITERATION,
} as const satisfies ScenarioDescriptor;

/** A sixteen-slot component with twenty compound-tested variants, every slot rendered. */
export const WIDE_SLOTS_WITH_MERGE = {
  id: "wide-slots-with-merge",
  group: "wide-slots",
  what: "Sixteen slots and twenty compound-tested variants, every slot rendered",
  batch: wideSlotsTestProps.length,
} as const satisfies ScenarioDescriptor;

/** Defining a button and rendering it twice, which reaches a lazy library's second-call compile and nothing after it. */
export const TWO_RENDERS_SIMPLE = {
  id: "two-renders-simple",
  group: "first-render",
  what: "Define a button component and render it with two selections (per definition; reaches a second-call compile — off the aggregates)",
  batch: COLD_DEFINITIONS_PER_LOOP,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/** Defining a slot component and rendering every slot twice. */
export const TWO_RENDERS_SLOTS = {
  id: "two-renders-slots",
  group: "first-render",
  what: "Define a slot component and render every slot for two selections (per definition; reaches a second-call compile — off the aggregates)",
  batch: COLD_DEFINITIONS_PER_LOOP,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/** Defining a button and rendering it three times, which reaches a lazy library's second-call compile. */
export const THREE_RENDERS_SIMPLE = {
  id: "three-renders-simple",
  group: "first-render",
  what: "Define a button component and render it with three selections (per definition; reaches a second-call compile — off the aggregates)",
  batch: COLD_DEFINITIONS_PER_LOOP,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/** Defining a slot component and rendering every slot for three selections. */
export const THREE_RENDERS_SLOTS = {
  id: "three-renders-slots",
  group: "first-render",
  what: "Define a slot component and render every slot for three selections (per definition; reaches a second-call compile — off the aggregates)",
  batch: COLD_DEFINITIONS_PER_LOOP,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * Each with-merge scenario mapped to its without-merge baseline, for the within-group section.
 *
 * @since 0.8.0
 */
export const SCENARIO_BASELINES: ReadonlyMap<string, string> = new Map(
  [
    SIMPLE_WITH_MERGE,
    COMPLEX_WITH_MERGE,
    SLOTS_WITH_MERGE,
    COMPOUND_SLOTS_WITH_MERGE,
    EXTENDS_WITH_MERGE,
    CREATE_TV_WITH_MERGE,
    EXTREME_WITH_MERGE,
    EXTREME_SLOTS_WITH_MERGE,
    REPEAT_SIMPLE_WITH_MERGE,
    REPEAT_SLOTS_WITH_MERGE,
    UNCACHED_SIMPLE_WITH_MERGE,
    UNCACHED_SLOTS_WITH_MERGE,
  ].map((descriptor) => [descriptor.id, descriptor.comparesWithin] as const),
);
