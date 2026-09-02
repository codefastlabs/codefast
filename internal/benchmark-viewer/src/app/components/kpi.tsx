import type { ReactNode } from "react";

import { formatLocal } from "#/app/lib/format";
import type { EmbeddedRun } from "#/types";

interface KpiGridProps {
  runCount: number;
  scenarioCount: number;
  latestRun: EmbeddedRun | undefined;
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <span className="text-bh-label shrink-0 text-[0.625rem] font-semibold tracking-[0.09em] whitespace-nowrap uppercase">
        {label}
      </span>
      <span className="min-w-0 text-sm leading-snug text-zinc-200">{children}</span>
    </div>
  );
}

/**
 * Renders the history overview as one compact strip: run count, scenario count, newest run, and
 * library builds.
 *
 * @since 0.3.16-canary.3
 */
export function KpiGrid({ runCount, scenarioCount, latestRun }: KpiGridProps) {
  return (
    <section
      aria-label="History overview"
      className="border-bh-border bg-bh-surface flex flex-wrap items-baseline gap-x-8 gap-y-2 rounded-2xl border px-4 py-3 shadow-(--shadow-bh-glass-tight) backdrop-blur-xl backdrop-saturate-180 sm:px-6"
    >
      <Stat label="Saved runs">{runCount}</Stat>
      <Stat label="Scenarios">{scenarioCount}</Stat>
      <Stat label="Newest run">
        <span suppressHydrationWarning>{latestRun ? formatLocal(latestRun.timestampIso, latestRun.folder) : "—"}</span>
      </Stat>
      <Stat label="Libraries">
        {latestRun?.libraryVersions?.length
          ? latestRun.libraryVersions.map((libraryVersion, versionIndex) => (
              <span className="whitespace-nowrap" key={libraryVersion.key}>
                {versionIndex > 0 && <span className="text-zinc-600"> · </span>}
                <span className="text-bh-lib-key">{libraryVersion.key}</span> {libraryVersion.version}
                {libraryVersion.gcExposed && (
                  <span className="text-amber-400" title="--expose-gc active">
                    {" "}
                    [gc]
                  </span>
                )}
              </span>
            ))
          : "—"}
      </Stat>
    </section>
  );
}
