/**
 * Scenario descriptors every head-to-head pair must agree on.
 *
 * Each pairwise report aligns rows by scenario `id` and reads `group`/`what`
 * from either side, so a descriptor that drifted between the codefast,
 * tailwind-variants, and cva sides would silently misalign or mislabel rows.
 * Every side spreads these descriptors and supplies only `build`; a side with
 * a genuinely different workload description overrides `what` after the spread.
 */
import type { BenchScenario } from "#/scenarios/types";

type ScenarioDescriptor = Pick<BenchScenario, "id" | "group" | "what">;

/**
 * @since 0.5.0-canary.7
 */
export const SIMPLE_WITHOUT_MERGE = {
  id: "simple-without-merge",
  group: "simple",
  what: "Simple button variants without tailwind-merge",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const SIMPLE_WITH_MERGE = {
  id: "simple-with-merge",
  group: "simple",
  what: "Simple button variants with tailwind-merge on tv",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const COMPLEX_WITHOUT_MERGE = {
  id: "complex-without-merge",
  group: "complex",
  what: "Complex variants (compounds, booleans) without tailwind-merge",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const COMPLEX_WITH_MERGE = {
  id: "complex-with-merge",
  group: "complex",
  what: "Complex variants with tailwind-merge on tv",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const SLOTS_WITHOUT_MERGE = {
  id: "slots-without-merge",
  group: "slots",
  what: "Slots (card-style) without tailwind-merge",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const SLOTS_WITH_MERGE = {
  id: "slots-with-merge",
  group: "slots",
  what: "Slots with tailwind-merge on tv",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const COMPOUND_SLOTS_WITHOUT_MERGE = {
  id: "compound-slots-without-merge",
  group: "compound-slots",
  what: "Compound slots (pagination-style) without tailwind-merge",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const COMPOUND_SLOTS_WITH_MERGE = {
  id: "compound-slots-with-merge",
  group: "compound-slots",
  what: "Compound slots with tailwind-merge on tv",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTENDS_WITHOUT_MERGE = {
  id: "extends-without-merge",
  group: "extends",
  what: "Extended tv config without tailwind-merge",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTENDS_WITH_MERGE = {
  id: "extends-with-merge",
  group: "extends",
  what: "Extended tv config with tailwind-merge on tv",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const CREATE_TV_WITHOUT_MERGE = {
  id: "create-tv-without-merge",
  group: "create-tv",
  what: "createTV factory without tailwind-merge",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const CREATE_TV_WITH_MERGE = {
  id: "create-tv-with-merge",
  group: "create-tv",
  what: "createTV factory with tailwind-merge",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTREME_WITHOUT_MERGE = {
  id: "extreme-without-merge",
  group: "extreme",
  what: "Large variant matrix without tailwind-merge",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTREME_WITH_MERGE = {
  id: "extreme-with-merge",
  group: "extreme",
  what: "Large variant matrix with tailwind-merge on tv",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTREME_SLOTS_WITHOUT_MERGE = {
  id: "extreme-slots-without-merge",
  group: "extreme-slots",
  what: "Many slots without tailwind-merge",
} as const satisfies ScenarioDescriptor;

/**
 * @since 0.5.0-canary.7
 */
export const EXTREME_SLOTS_WITH_MERGE = {
  id: "extreme-slots-with-merge",
  group: "extreme-slots",
  what: "Many slots with tailwind-merge on tv",
} as const satisfies ScenarioDescriptor;
