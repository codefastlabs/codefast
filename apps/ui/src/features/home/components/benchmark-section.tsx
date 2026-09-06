import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

import { SectionHeader } from "#/components/shared/section-header";
import { track } from "#/features/tracking/lib/tracking";
import { GITHUB_URL } from "#/lib/nav-links";

const LEDGER_URL = `${GITHUB_URL}/blob/main/benchmarks/di-inversify/RESULTS.md`;
const GUIDE_URL = `${GITHUB_URL}/blob/main/benchmarks/di-inversify/BENCH_GUIDE.md`;

type BenchmarkSectionProps = Omit<ComponentProps<"section">, "children">;

/** The benchmark suite, pointed at rather than quoted: every figure lives next to the method that produced it. */
export function BenchmarkSection({ className, ...props }: BenchmarkSectionProps) {
  return (
    <section
      aria-labelledby="home-benchmarks-title"
      className={cn("border-t border-ui-border/60 bg-ui-surface py-24 sm:py-32", className)}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-20">
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
            description="A first-party suite runs the same workloads through @codefast/di, InversifyJS, Awilix and tsyringe. Its ledger records every figure beside the recipe that produced it and the machine it ran on, and the guide shows how to re-run any row. A number without its method is not worth quoting, so this page quotes none."
            className="reveal-up"
          />
          <div className="reveal-up flex flex-col gap-4 rounded-2xl border border-ui-border/60 bg-ui-card p-6 sm:p-8">
            <p className="font-mono text-xs text-ui-muted">benchmarks/di-inversify</p>
            <p className="text-sm leading-relaxed text-ui-muted">
              Paired and interleaved runs, an isolated profile, three trials per row, and the per-trial spread reported
              with each cell. Ratios are read across libraries in the same window, never from absolute throughput.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
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
