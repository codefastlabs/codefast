/** Server-only reader of the benchmark ledger, bundled at build through a raw glob like the package documents. */
import type { LedgerFacts } from "#features/home/lib/benchmark-ledger-facts";
import { parseLedgerFacts } from "#features/home/lib/benchmark-ledger-facts";

const [LEDGER = ""] = Object.values(
  import.meta.glob<string>("../../../../../../benchmarks/di/RESULTS.md", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
);

/** The ledger's self-description; empty facts when the file is missing, and when it is misread, logging why. */
export function readLedgerFacts(markdown = LEDGER): LedgerFacts {
  try {
    return parseLedgerFacts(markdown);
  } catch (error) {
    // A reworded ledger costs the landing page its scoreboard, never the page; the tests are what fail on it.
    console.error("The home page shows no benchmark scoreboard:", error instanceof Error ? error.message : error);

    return parseLedgerFacts("");
  }
}
