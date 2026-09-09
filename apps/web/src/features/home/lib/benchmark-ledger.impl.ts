/** Server-only reader of the benchmark ledger, bundled at build through a raw glob like the package documents. */
import type { LedgerFacts } from "#/features/home/lib/benchmark-ledger-facts";
import { parseLedgerFacts } from "#/features/home/lib/benchmark-ledger-facts";

const ledgers = import.meta.glob<string>("../../../../../../benchmarks/di/RESULTS.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

/** The ledger's self-description; empty facts when the file is missing rather than a failed build. */
export function readLedgerFacts(): LedgerFacts {
  const [markdown = ""] = Object.values(ledgers);

  return parseLedgerFacts(markdown);
}
