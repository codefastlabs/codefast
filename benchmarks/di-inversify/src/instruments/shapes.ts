/**
 * What an instrument may run, and what each shape is in the comparison table.
 *
 * A row-backed shape runs that row's own scenario — same construction, same batch factor, same
 * sanity check — so an instrument's number is comparable to the suite's by construction rather than
 * by resemblance. A shape the suite has no row for says so in `row`, which is the only thing that
 * keeps such a gap visible.
 */
import type { BenchScenario } from "@codefast/benchmark-harness/child/bench-scenario";
import { isAsyncScenario } from "@codefast/benchmark-harness/child/bench-scenario";
import { Container, injectable, token } from "@codefast/di";

import { batched } from "#/harness/batched";
import { collectAllCodefastScenarios } from "#/scenarios/collect-codefast-scenarios";
import type { AnyScenario } from "#/scenarios/types";

/** The measured operation, plus how many logical operations one call of it performs. */
export interface PreparedShape {
  readonly batch: number;
  readonly run: () => void;
}

export interface InstrumentShape {
  readonly id: string;
  /** The bench row this measures, or `null` when the suite has none — `what` then says why. */
  readonly row: string | null;
  readonly what: string;
  readonly prepare: () => PreparedShape;
}

const INTERPRETED_NAMED_ROW = "slot-injected-name-interpreted";

let collected: ReadonlyArray<AnyScenario> | undefined;

/** Collected once: building every scenario also builds every scenario's container. */
function allScenarios(): ReadonlyArray<AnyScenario> {
  collected ??= collectAllCodefastScenarios();

  return collected;
}

function requireSyncScenario(row: string): BenchScenario {
  const scenario = allScenarios().find((candidate) => candidate.id === row);

  if (scenario === undefined) {
    throw new Error(`no bench row "${row}"`);
  }
  if (isAsyncScenario(scenario)) {
    throw new Error(`bench row "${row}" is async; the instruments measure the sync lane`);
  }

  return scenario;
}

function prepareRow(row: string): PreparedShape {
  const scenario = requireSyncScenario(row);

  if (scenario.sanity?.() === false) {
    throw new Error(`bench row "${row}" failed its own sanity check`);
  }

  return { batch: scenario.batch ?? 1, run: scenario.build() };
}

function fromRow(id: string, row: string, what: string): InstrumentShape {
  return { id, row, what, prepare: () => prepareRow(row) };
}

// ── The one shape with no row: a control, not a claim ─────────────────────────

interface PlainLeaf {
  readonly id: string;
}

const PLAIN_SLOT_NAMES = ["alpha", "beta", "gamma", "delta"] as const;
const plainTokens = PLAIN_SLOT_NAMES.map((name) => token<PlainLeaf>(`instrument-plain-${name}`));

@injectable(plainTokens)
class PlainRoot {
  constructor(
    readonly alpha: PlainLeaf,
    readonly beta: PlainLeaf,
    readonly gamma: PlainLeaf,
    readonly delta: PlainLeaf,
  ) {}
}

/** The batch comes from the row this controls for, so the two cannot drift apart. */
function preparePlainControl(): PreparedShape {
  const { batch } = prepareRow(INTERPRETED_NAMED_ROW);
  const container = Container.create();

  for (const [index, name] of PLAIN_SLOT_NAMES.entries()) {
    container.bind(plainTokens[index]!).toConstantValue({ id: name });
  }
  container
    .bind(PlainRoot)
    .toSelf()
    .transient()
    .onActivation((_ctx, instance) => instance);
  container.resolve(PlainRoot);

  return { batch, run: batched(batch, () => void container.resolve(PlainRoot)) };
}

export const INSTRUMENT_SHAPES: ReadonlyArray<InstrumentShape> = [
  fromRow("compiled-named", "slot-injected-name-compiled", "four named dependencies behind a compiled plan"),
  fromRow("interpreted-named", INTERPRETED_NAMED_ROW, "the same four with the class's plan declined"),
  {
    id: "interpreted-plain",
    row: null,
    what: "the same class shape with no criterion on any slot — a control for interpreted-named, not a claim, which is why no row states it",
    prepare: preparePlainControl,
  },
  fromRow("realistic", "realistic-graph-resolve-root", "the ten-node application graph"),
  fromRow("mid-chain", "scale-mid-transient-chain-32", "the mid-depth transient chain"),
  fromRow("deep-chain", "scale-deep-transient-chain-512", "the deep transient chain"),
  fromRow("fan-out", "fan-out-tree-depth-3-breadth-4", "the fan-out tree"),
];

export function findShape(id: string): InstrumentShape {
  const shape = INSTRUMENT_SHAPES.find((candidate) => candidate.id === id);

  if (shape === undefined) {
    throw new Error(`unknown BENCH_ALLOC_SHAPE "${id}"; known: ${INSTRUMENT_SHAPES.map((each) => each.id).join(", ")}`);
  }

  return shape;
}
