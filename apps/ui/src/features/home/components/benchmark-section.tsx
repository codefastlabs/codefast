import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { SectionHeader } from "#/components/shared/section-header";
import type { LedgerFacts } from "#/features/home/lib/benchmark-ledger-facts";
import { track } from "#/features/tracking/lib/tracking";
import { GITHUB_URL } from "#/lib/nav-links";

const LEDGER_URL = `${GITHUB_URL}/blob/main/benchmarks/di-inversify/RESULTS.md`;
const GUIDE_URL = `${GITHUB_URL}/blob/main/benchmarks/di-inversify/BENCH_GUIDE.md`;

// A fixed locale and zone, so the server render and the client agree on the label.
const LEDGER_DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

/** `2026-09-01` as a readable day, kept machine-readable on the element. */
function LedgerDate({ date }: { readonly date: string }) {
  return <time dateTime={date}>{LEDGER_DATE.format(new Date(`${date}T00:00:00Z`))}</time>;
}

interface BenchmarkSectionProps extends Omit<ComponentProps<"section">, "children"> {
  /** What the ledger states about its own runs, read at build time. */
  readonly ledger: LedgerFacts;
}

/** The benchmark suite, pointed at rather than quoted: the ledger's own facts here, every figure next to its method. */
export function BenchmarkSection({ ledger, className, ...props }: BenchmarkSectionProps) {
  return (
    <section
      aria-labelledby="home-benchmarks-title"
      className={cn("border-t border-ui-border/60 bg-ui-surface py-24 sm:py-32", className)}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-20">
          <SectionHeader
            eyebrow="Benchmarks"
            titleId="home-benchmarks-title"
            title={
              <>
                Measured, with
                <br />
                the method attached.
              </>
            }
            description="A first-party suite runs the same workloads through @codefast/di, InversifyJS, Awilix and tsyringe. Its ledger records every figure beside the recipe that produced it and the machine it ran on, and the guide shows how to re-run any row. A number without its method is not worth quoting, so this page shows what the ledger compared and when, and leaves the figures to it."
            className="reveal-up"
          />
          <div className="reveal-up flex flex-col gap-5 rounded-2xl border border-ui-border/60 bg-ui-card p-6 sm:p-8">
            <p className="font-mono text-xs text-ui-muted">benchmarks/di-inversify/RESULTS.md</p>
            <dl className="flex flex-col gap-4 text-sm">
              {ledger.libraries.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <dt className="text-xs font-semibold tracking-widest text-ui-muted uppercase">Compared</dt>
                  <dd>
                    <ul className="flex flex-wrap gap-2" aria-label="Libraries compared">
                      {ledger.libraries.map((library) => (
                        <li
                          key={library.name}
                          className="inline-flex items-baseline gap-1.5 rounded-full border border-ui-border/60 bg-ui-surface px-3 py-1 font-mono text-xs"
                        >
                          <span className="text-ui-fg">{library.name}</span>
                          <span className="text-ui-muted">{library.version}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
              {ledger.environment ? (
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold tracking-widest text-ui-muted uppercase">Environment</dt>
                  <dd className="font-mono text-xs leading-relaxed text-ui-fg">{ledger.environment}</dd>
                </div>
              ) : null}
              {ledger.latestEntry ? (
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold tracking-widest text-ui-muted uppercase">Latest entry</dt>
                  <dd className="leading-relaxed text-ui-fg">
                    <LedgerDate date={ledger.latestEntry.date} />
                    <span className="text-ui-muted"> · {ledger.latestEntry.title}</span>
                  </dd>
                </div>
              ) : null}
              {ledger.lastFullRemeasure ? (
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold tracking-widest text-ui-muted uppercase">
                    Last full re-measure
                  </dt>
                  <dd className="leading-relaxed text-ui-fg">
                    <LedgerDate date={ledger.lastFullRemeasure} />
                  </dd>
                </div>
              ) : null}
            </dl>
            <p className="text-sm leading-relaxed text-ui-muted">
              Paired and interleaved runs, an isolated profile, three trials per row, and the per-trial spread reported
              with each cell. Ratios are read across libraries in the same window, never from absolute throughput.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild>
                <a
                  href={LEDGER_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    track("open_external", { destination: "github", surface: "home-benchmarks" });
                  }}
                >
                  Read the ledger
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={GUIDE_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    track("open_external", { destination: "github", surface: "home-benchmarks" });
                  }}
                >
                  Run it yourself
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
