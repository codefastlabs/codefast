import type { PaletteEntry } from "#/app/lib/colors";
import { formatLocal } from "#/app/lib/format";
import type { SnapshotRow } from "#/app/lib/metrics";
import type { EmbeddedLibraryMeta, EmbeddedRun } from "#/types";

const TH =
  "border-b border-b-bh-table-line bg-bh-table-head z-3 px-[0.65rem] py-[0.15rem] text-left text-bh-label text-[0.7rem] font-semibold tracking-wider whitespace-nowrap uppercase";
const TD = "border-b border-b-bh-table-line px-[0.65rem] py-[0.15rem] text-left";
const STICKY_1 =
  "bg-bh-table-sticky sticky left-0 z-2 max-w-56 min-w-30 shadow-[0.0625rem_0_0_var(--color-bh-border-strong)]";
const STICKY_2 =
  "bg-bh-table-sticky sticky left-30 z-2 min-w-20 shadow-[0.0625rem_0_0_var(--color-bh-border-strong)]";
const NUM = "text-right tabular-nums";

interface SnapshotSectionProps {
  runCount: number;
  orderedLibraries: Array<EmbeddedLibraryMeta>;
  compareLibs: Array<EmbeddedLibraryMeta>;
  paletteMap: Record<string, PaletteEntry>;
  snapshotRows: Array<SnapshotRow>;
  latestRun: EmbeddedRun | undefined;
}

export function SnapshotSection({
  runCount,
  orderedLibraries,
  compareLibs,
  paletteMap,
  snapshotRows,
  latestRun,
}: SnapshotSectionProps) {
  return (
    <details
      className="border-bh-border bg-bh-surface open:bg-bh-surface-open-muted mt-10 rounded-[1.25rem] border px-5 py-4 backdrop-blur-xl backdrop-saturate-180 sm:px-6"
      id="snapshot-details"
    >
      <summary className="cursor-pointer list-none py-1 text-sm leading-snug font-semibold text-zinc-100 marker:content-[''] [&::-webkit-details-marker]:hidden">
        Snapshot of <span className="text-cyan-200/90">globally newest</span> bench folder —
        throughput by scenario (table)
      </summary>
      <p className="mb-3 text-xs leading-relaxed text-zinc-500" id="snapshot-desc">
        Rows use the chronologically last run directory ({runCount} total), independent of the
        Environment selector.
      </p>
      <div className="border-bh-border bg-bh-scrim-table overflow-x-auto rounded-xl border [-webkit-overflow-scrolling:touch]">
        <table
          aria-label="Latest run throughput by scenario"
          className="w-full border-collapse text-[0.8rem]"
        >
          <thead>
            <tr>
              <th className={`${TH} ${STICKY_1}`} scope="col">
                Scenario
              </th>
              <th className={`${TH} ${STICKY_2}`} scope="col">
                Group
              </th>
              {orderedLibraries.map((lib) => (
                <th
                  className={`${TH} ${NUM}`}
                  key={lib.key}
                  scope="col"
                  style={{ color: paletteMap[lib.key]?.text }}
                >
                  {lib.displayName}
                </th>
              ))}
              {compareLibs.map((cmp) => (
                <th className={`${TH} ${NUM} text-bh-ratio-accent`} key={cmp.key} scope="col">
                  ÷ {cmp.displayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshotRows.map((row) => (
              <tr
                className="hover:bg-bh-table-hover even:bg-bh-table-zebra even:hover:bg-bh-table-zebra-hover"
                key={row.id}
              >
                <td className={`${TD} ${STICKY_1}`}>{row.id}</td>
                <td className={`${TD} ${STICKY_2}`}>{row.group}</td>
                {row.hzCells.map((hzCell, cellIndex) => (
                  <td className={`${TD} ${NUM}`} key={cellIndex}>
                    {hzCell}
                  </td>
                ))}
                {row.ratioCells.map((ratioCell, cellIndex) => (
                  <td className={`${TD} ${NUM}`} key={cellIndex}>
                    {ratioCell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {latestRun && (
        <div className="mt-2 text-xs text-zinc-600" suppressHydrationWarning>
          Folder {latestRun.folder} · {formatLocal(latestRun.timestampIso, latestRun.folder)}{" "}
          (local)
        </div>
      )}
    </details>
  );
}
