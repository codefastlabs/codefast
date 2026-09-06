import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { ScrollFade } from "#/components/shared/scroll-fade";
import { SectionHeader } from "#/components/shared/section-header";
import { LedgerDate } from "#/features/home/components/ledger-date";
import { ScoreBar } from "#/features/home/components/score-bar";
import type { LedgerFacts } from "#/features/home/lib/benchmark-ledger-facts";
import { track } from "#/features/tracking/lib/tracking";
import { GITHUB_URL } from "#/lib/nav-links";

const LEDGER_URL = `${GITHUB_URL}/blob/main/benchmarks/di-inversify/RESULTS.md`;
const LOSSES_URL = `${LEDGER_URL}#where-it-loses`;
const GUIDE_URL = `${GITHUB_URL}/blob/main/benchmarks/di-inversify/BENCH_GUIDE.md`;

/** The ledger's `name version` for a competitor line, matched by name prefix; the line's own label otherwise. */
function competitorLabel(ledger: LedgerFacts, competitor: string): string {
  const library = ledger.libraries.find((candidate) =>
    competitor.toLowerCase().startsWith(candidate.name.toLowerCase()),
  );

  return library ? `${library.name} ${library.version}` : competitor;
}

function trackLedgerClick(): void {
  track("open_external", { destination: "github", surface: "home-benchmarks" });
}

interface BenchmarkSectionProps extends Omit<ComponentProps<"section">, "children"> {
  /** What the ledger states about its own runs, read at build time. */
  readonly ledger: LedgerFacts;
}

/** The benchmark suite's scoreboard, every figure lifted from the ledger's aggregates table and linked back to it. */
export function BenchmarkSection({ ledger, className, ...props }: BenchmarkSectionProps) {
  const wins = ledger.aggregates.reduce((sum, row) => sum + row.wins, 0);
  const parities = ledger.aggregates.reduce((sum, row) => sum + row.parities, 0);
  const lossCount = ledger.aggregates.reduce((sum, row) => sum + row.losses, 0);
  const rows = wins + parities + lossCount;

  return (
    <section
      aria-labelledby="home-benchmarks-title"
      className={cn("border-t border-ui-border/60 bg-ui-surface py-24 sm:py-32", className)}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-20">
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
            description="A first-party suite runs the same workloads through @codefast/di, InversifyJS, Awilix and tsyringe, every library interleaved so none of them rides the machine's drift. Its ledger records every figure beside the recipe that produced it and the machine it ran on, and the guide shows how to re-run any row. The scoreboard here is lifted from that ledger at build time, losses included."
            className="reveal-up"
          />
          <div className="reveal-up flex flex-col gap-5 rounded-2xl border border-ui-border/60 bg-ui-card p-6 sm:p-8">
            <p className="font-mono text-xs leading-relaxed text-ui-muted">
              benchmarks/di-inversify/RESULTS.md
              {ledger.aggregateProfile ? ` · ${ledger.aggregateProfile}` : null}
            </p>
            {ledger.aggregates.length > 0 ? (
              <>
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-ui-fg">
                    <span className="font-semibold">@codefast/di</span>
                    <span className="text-ui-muted">{` across ${rows} head-to-head rows`}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <ScoreBar wins={wins} parities={parities} losses={lossCount} className="h-2.5 flex-1" />
                    <span className="shrink-0 font-mono text-xs text-ui-fg tabular-nums">
                      {`${wins} wins · ${parities} parity · ${lossCount} ${lossCount === 1 ? "loss" : "losses"}`}
                    </span>
                  </div>
                </div>
                <ScrollFade className="[--scroll-fade-color:var(--ui-card)]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[26rem] text-sm">
                      <caption className="sr-only">How @codefast/di fared against each competitor</caption>
                      <thead className="text-xs text-ui-muted">
                        <tr>
                          <th scope="col" rowSpan={2} className="pb-2 text-start align-bottom font-medium">
                            against
                          </th>
                          <th scope="col" rowSpan={2} className="pb-2 text-start align-bottom font-medium">
                            wins · parity · losses
                          </th>
                          <th
                            scope="colgroup"
                            colSpan={2}
                            className="pb-1 text-end font-medium whitespace-nowrap text-ui-fg"
                          >
                            @codefast/di faster by
                          </th>
                        </tr>
                        <tr>
                          <th scope="col" className="pe-3 pb-2 text-end font-medium whitespace-nowrap">
                            median
                          </th>
                          <th scope="col" className="pb-2 text-end font-medium whitespace-nowrap">
                            geomean
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ui-border/60">
                        {ledger.aggregates.map((row) => (
                          <tr key={row.competitor}>
                            <th scope="row" className="py-3 pe-3 text-start font-mono text-xs font-normal text-ui-fg">
                              <span className="text-ui-muted">vs </span>
                              {competitorLabel(ledger, row.competitor)}
                            </th>
                            <td className="py-3 pe-3">
                              <div className="flex items-center gap-2">
                                <ScoreBar
                                  wins={row.wins}
                                  parities={row.parities}
                                  losses={row.losses}
                                  className="min-w-12"
                                />
                                <span className="shrink-0 font-mono text-xs text-ui-muted tabular-nums">
                                  {`${row.wins} · ${row.parities} · ${row.losses}`}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 pe-3 text-end font-semibold whitespace-nowrap text-ui-fg tabular-nums">
                              {row.median.toFixed(2)}×
                            </td>
                            <td className="py-3 text-end font-semibold whitespace-nowrap text-ui-fg tabular-nums">
                              {row.geomean.toFixed(2)}×
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ScrollFade>
                <p className="text-xs leading-relaxed text-ui-muted">
                  A ratio is @codefast/di&rsquo;s throughput over the competitor&rsquo;s on the same row, so 2× means
                  twice the work in the same time.
                </p>
              </>
            ) : null}
            <p className="text-sm leading-relaxed text-ui-muted">
              {lossCount === 0 ? (
                "No comparable row lost; parity and unreliable rows are marked in the ledger."
              ) : (
                <>
                  {lossCount === 1 ? "The one loss" : `The ${lossCount} losses`}
                  {ledger.losses.length > 0
                    ? `: ${ledger.losses.map((loss) => `${loss.scenario} at ${loss.ratio}× of ${loss.competitor}`).join(", ")}, `
                    : " "}
                  stay published, with the reason, under{" "}
                  <a
                    href={LOSSES_URL}
                    target="_blank"
                    rel="noreferrer"
                    onClick={trackLedgerClick}
                    className="text-ui-fg underline underline-offset-4 hover:text-ui-brand"
                  >
                    Where it loses
                  </a>
                  .
                </>
              )}
            </p>
            {ledger.environment || ledger.lastFullRemeasure ? (
              <p className="font-mono text-xs leading-relaxed text-ui-muted">
                {ledger.environment}
                {ledger.environment && ledger.lastFullRemeasure ? " · " : null}
                {ledger.lastFullRemeasure ? (
                  <>
                    last full re-measure <LedgerDate date={ledger.lastFullRemeasure} />
                  </>
                ) : null}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild>
                <a href={LEDGER_URL} target="_blank" rel="noreferrer" onClick={trackLedgerClick}>
                  Read the ledger
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={GUIDE_URL} target="_blank" rel="noreferrer" onClick={trackLedgerClick}>
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
