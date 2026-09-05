/** Scenario descriptors every side spreads, so a row's id, group, description, and batch cannot drift. */
import { complexTestProps } from "#/fixtures/complex";
import { compoundSlotsTestProps } from "#/fixtures/compound-slots";
import { simpleTestProps as createTvTestProps } from "#/fixtures/create-tv";
import { extendsTestProps } from "#/fixtures/extends";
import { extremeSlotsTestProps, extremeTestProps } from "#/fixtures/extreme";
import { repeatSimpleTestProps, repeatSlotsTestProps } from "#/fixtures/repeat";
import { simpleTestProps } from "#/fixtures/simple";
import { slotsTestProps } from "#/fixtures/slots";
import type { BenchScenario } from "#/scenarios/types";

type ScenarioDescriptor = Pick<BenchScenario, "id" | "group" | "what"> &
  Partial<Pick<BenchScenario, "batch" | "excludeFromAggregates">>;

/**
 * Component definitions per timed iteration of a cold row, so every side's loop bound and batch agree.
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
  group: "repeat-slots",
  what: "Slots, 3 selections repeated, with tailwind-merge on tv",
  batch: repeatSlotsTestProps.length,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.6.0
 */
export const UNCACHED_SIMPLE_WITH_MERGE = {
  id: "uncached-simple-with-merge",
  group: "uncached",
  what: "Control, not a comparison: simple variants with the resolution and merge caches off, so the plan walk and the merge stay measured",
  batch: simpleTestProps.length,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.6.0
 */
export const UNCACHED_SLOTS_WITH_MERGE = {
  id: "uncached-slots-with-merge",
  group: "uncached",
  what: "Control, not a comparison: slots with the resolution and merge caches off, so the plan walk and the merge stay measured",
  batch: slotsTestProps.length,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * The without-merge control for simple variants, paired with its with-merge row to isolate the merge step.
 */
export const UNCACHED_SIMPLE_WITHOUT_MERGE = {
  id: "uncached-simple-without-merge",
  group: "uncached",
  what: "Control, not a comparison: simple variants with the resolution cache and tailwind-merge off; its delta from the with-merge row is the merge step",
  batch: simpleTestProps.length,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * The without-merge control for slots, paired with its with-merge row to isolate the merge step.
 */
export const UNCACHED_SLOTS_WITHOUT_MERGE = {
  id: "uncached-slots-without-merge",
  group: "uncached",
  what: "Control, not a comparison: slots with the resolution cache and tailwind-merge off; its delta from the with-merge row is the merge step",
  batch: slotsTestProps.length,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;

/**
 * Defining a button without rendering it: an eager library compiles here, a lazy one on its first render.
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
 */
export const FIRST_RENDER_SLOTS = {
  id: "first-render-slots",
  group: "first-render",
  what: "Define a slot component and render every slot once (per definition, not per render; minus define-only it is the first render — off the aggregates)",
  batch: COLD_DEFINITIONS_PER_LOOP,
  excludeFromAggregates: true,
} as const satisfies ScenarioDescriptor;
