import { formatLocal } from "#/app/lib/format";
import type { EmbeddedRun } from "#/types";

interface KpiGridProps {
  runCount: number;
  scenarioCount: number;
  latestRun: EmbeddedRun | undefined;
}

export function KpiGrid({ runCount, scenarioCount, latestRun }: KpiGridProps) {
  return (
    <div aria-label="History overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="bh-card">
        <div className="bh-lbl">Saved runs</div>
        <div className="bh-val text-zinc-100">{runCount}</div>
      </div>
      <div className="bh-card">
        <div className="bh-lbl">Scenarios tracked</div>
        <div className="bh-val text-zinc-100">{scenarioCount}</div>
      </div>
      <div className="bh-card sm:col-span-2 xl:col-span-1">
        <div className="bh-lbl">Newest saved run · local clock</div>
        <div className="bh-val text-sm text-zinc-200" suppressHydrationWarning>
          {latestRun
            ? (() => {
                const clock = formatLocal(latestRun.timestampIso, latestRun.folder);
                return clock ? `${clock} · folder ${latestRun.folder}` : latestRun.folder;
              })()
            : "—"}
        </div>
      </div>
      <div className="bh-card xl:col-span-1">
        <div className="bh-lbl">Library builds (latest run)</div>
        <div className="bh-val text-xs leading-snug font-normal text-zinc-400">
          {latestRun?.libraryVersions?.length
            ? latestRun.libraryVersions.map((lv) => (
                <div className="mt-0.5 leading-[1.45]" key={lv.key}>
                  <span className="text-[var(--color-bh-lib-key)]">{lv.key}</span> {lv.version}
                  {lv.gcExposed && (
                    <span className="text-amber-400" title="--expose-gc active">
                      {" "}
                      [gc]
                    </span>
                  )}
                </div>
              ))
            : "—"}
        </div>
      </div>
    </div>
  );
}
