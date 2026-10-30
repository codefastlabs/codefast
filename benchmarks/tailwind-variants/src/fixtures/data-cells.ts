/**
 * A table cell whose selection comes from each row's data and whose `className` comes from its column, so the distinct
 * calls run to the product of the two rather than to a count of call sites.
 */

const STATUSES = ["active", "archived", "blocked", "draft", "failed", "pending", "queued", "running"] as const;
const ALIGNS = ["center", "end", "start"] as const;
const DENSITIES = ["comfortable", "compact", "spacious"] as const;
const COLUMN_CLASSES = [
  undefined,
  "w-12",
  "w-24",
  "w-32",
  "w-48",
  "font-mono",
  "tabular-nums",
  "truncate",
  "px-2",
  "px-6",
  "text-xs",
  "text-base",
  "hidden md:table-cell",
  "hidden lg:table-cell",
  "sticky left-0",
  "max-w-64 truncate",
] as const;

/** A cell keyed by a row's status and a column's alignment and density, with one compound on the status. */
export const dataCellVariants = {
  base: "border-b border-border px-4 py-2 align-middle text-sm",
  compoundVariants: [
    { class: "animate-pulse", density: "compact", status: "running" },
    { class: "font-semibold", align: "end", status: "failed" },
  ],
  variants: {
    align: { center: "text-center", end: "text-end", start: "text-start" },
    density: { comfortable: "py-2", compact: "py-1 text-xs", spacious: "py-4" },
    status: {
      active: "text-emerald-600",
      archived: "text-muted-foreground line-through",
      blocked: "bg-red-50 text-red-700",
      draft: "text-muted-foreground italic",
      failed: "bg-red-100 text-red-800",
      pending: "text-amber-600",
      queued: "text-sky-600",
      running: "bg-sky-50 text-sky-700",
    },
  },
} as const;

/** One cell render: the row's selection and the column's `className`. */
export interface DataCellCall {
  readonly className: string | undefined;
  readonly props: Readonly<Record<string, string>>;
}

/** Cell renders one timed iteration makes; the loop walks the draws below in order, so no iteration repeats the last. */
export const DATA_CELLS_PER_ITERATION = 16;

const createRandom = (seed: number): (() => number) => {
  let state = seed;

  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;

    return state / 2_147_483_648;
  };
};

const pick = <Value>(random: () => number, values: ReadonlyArray<Value>): Value =>
  values[Math.floor(random() * values.length)] as Value;

/** A long deterministic stream of cell renders drawn from about a thousand distinct ones. */
export const dataCellTestCalls: ReadonlyArray<DataCellCall> = (() => {
  const random = createRandom(42);
  const calls: Array<DataCellCall> = [];

  for (let index = 0; index < 8192; index++) {
    calls.push({
      className: pick(random, COLUMN_CLASSES),
      props: { align: pick(random, ALIGNS), density: pick(random, DENSITIES), status: pick(random, STATUSES) },
    });
  }

  return calls;
})();
