/** Server-only reader of the benchmark ledger's facts, bundled at build through an eager glob. */
import type { LedgerFacts } from "#features/home/lib/benchmark-ledger-facts";
import { EMPTY_LEDGER_FACTS, parseLedgerFacts } from "#features/home/lib/benchmark-ledger-facts";

const [RESULTS] = Object.values(
  import.meta.glob<unknown>("../../../../../../benchmarks/di/results.json", { import: "default", eager: true }),
);

/** The ledger's facts; empty facts when the file is missing, and when it is misread, logging why. */
export function readLedgerFacts(results: unknown = RESULTS): LedgerFacts {
  if (results === undefined) {
    return EMPTY_LEDGER_FACTS;
  }

  try {
    return parseLedgerFacts(results);
  } catch (error) {
    // A reshaped facts file costs the landing page its scoreboard, never the page; the tests are what fail on it.
    console.error("The home page shows no benchmark scoreboard:", error instanceof Error ? error.message : error);

    return EMPTY_LEDGER_FACTS;
  }
}
