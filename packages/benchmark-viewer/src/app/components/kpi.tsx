import { formatLocal } from "#/app/lib/format";
import type { EmbeddedRun } from "#/types";

interface KpiGridProps {
  runCount: number;
  scenarioCount: number;
  latestRun: EmbeddedRun | undefined;
}

const CARD =
  "border-bh-border bg-bh-surface-elevated shadow-bh-card hover:border-bh-border-strong hover:shadow-bh-card-hover rounded-2xl border px-[1.05rem] py-[0.85rem] backdrop-blur-lg backdrop-saturate-160 [transition:border-color_0.2s_ease,box-shadow_0.2s_ease] motion-reduce:transition-none";
const LBL = "text-bh-label mb-[0.4rem] text-[0.625rem] font-semibold tracking-[0.09em] uppercase";
const VAL =
  "text-[1.05rem] leading-[1.3] font-semibold tracking-[-0.028em] wrap-break-word tabular-nums";

export function KpiGrid({ runCount, scenarioCount, latestRun }: KpiGridProps) {
  return (
    <div aria-label="History overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className={CARD}>
        <div className={LBL}>Saved runs</div>
        <div className={`${VAL} text-zinc-100`}>{runCount}</div>
      </div>

      <div className={CARD}>
        <div className={LBL}>Scenarios tracked</div>
        <div className={`${VAL} text-zinc-100`}>{scenarioCount}</div>
      </div>

      <div className={`${CARD} sm:col-span-2 xl:col-span-1`}>
        <div className={LBL}>Newest saved run · local clock</div>
        <div className={`${VAL} text-sm text-zinc-200`} suppressHydrationWarning>
          {latestRun
            ? (() => {
                const clock = formatLocal(latestRun.timestampIso, latestRun.folder);
                return clock ? `${clock} · folder ${latestRun.folder}` : latestRun.folder;
              })()
            : "—"}
        </div>
      </div>

      <div className={`${CARD} xl:col-span-1`}>
        <div className={LBL}>Library builds (latest run)</div>
        <div className={`${VAL} text-xs leading-snug font-normal text-zinc-400`}>
          {latestRun?.libraryVersions?.length
            ? latestRun.libraryVersions.map((lv) => (
                <div className="mt-0.5 leading-[1.45]" key={lv.key}>
                  <span className="text-bh-lib-key">{lv.key}</span> {lv.version}
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
