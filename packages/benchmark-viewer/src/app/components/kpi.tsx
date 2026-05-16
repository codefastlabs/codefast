import { formatLocal } from "#/app/lib/format";
import { KpiCard, KpiCardLabel, KpiCardValue } from "#/app/components/kpi-card";
import type { EmbeddedRun } from "#/types";

interface KpiGridProps {
  runCount: number;
  scenarioCount: number;
  latestRun: EmbeddedRun | undefined;
}

export function KpiGrid({ runCount, scenarioCount, latestRun }: KpiGridProps) {
  return (
    <div aria-label="History overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard>
        <KpiCardLabel>Saved runs</KpiCardLabel>
        <KpiCardValue className="text-zinc-100">{runCount}</KpiCardValue>
      </KpiCard>

      <KpiCard>
        <KpiCardLabel>Scenarios tracked</KpiCardLabel>
        <KpiCardValue className="text-zinc-100">{scenarioCount}</KpiCardValue>
      </KpiCard>

      <KpiCard className="sm:col-span-2 xl:col-span-1">
        <KpiCardLabel>Newest saved run · local clock</KpiCardLabel>
        <KpiCardValue className="text-sm text-zinc-200" suppressHydrationWarning>
          {latestRun
            ? (() => {
                const clock = formatLocal(latestRun.timestampIso, latestRun.folder);
                return clock ? `${clock} · folder ${latestRun.folder}` : latestRun.folder;
              })()
            : "—"}
        </KpiCardValue>
      </KpiCard>

      <KpiCard className="xl:col-span-1">
        <KpiCardLabel>Library builds (latest run)</KpiCardLabel>
        <KpiCardValue className="text-xs leading-snug font-normal text-zinc-400">
          {latestRun?.libraryVersions?.length
            ? latestRun.libraryVersions.map((libraryVersion) => (
                <div className="mt-0.5 leading-[1.45]" key={libraryVersion.key}>
                  <span className="text-bh-lib-key">{libraryVersion.key}</span>{" "}
                  {libraryVersion.version}
                  {libraryVersion.gcExposed && (
                    <span className="text-amber-400" title="--expose-gc active">
                      {" "}
                      [gc]
                    </span>
                  )}
                </div>
              ))
            : "—"}
        </KpiCardValue>
      </KpiCard>
    </div>
  );
}
