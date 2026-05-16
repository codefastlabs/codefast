import type { PaletteEntry } from "#/app/lib/colors";
import { formatLocal } from "#/app/lib/format";
import type { SnapshotRow } from "#/app/lib/metrics";
import type { EmbeddedLibraryMeta, EmbeddedRun } from "#/types";

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
      <summary className="bh-details-summary bh-details-summary--dense">
        Snapshot of <span className="text-cyan-200/90">globally newest</span> bench folder —
        throughput by scenario (table)
      </summary>
      <p className="mb-3 text-xs leading-relaxed text-zinc-500" id="snapshot-desc">
        Rows use the chronologically last run directory ({runCount} total), independent of the
        Environment selector.
      </p>
      <div className="bh-table-wrap">
        <table aria-label="Latest run throughput by scenario" className="bh-table bh-table--zebra">
          <thead>
            <tr>
              <th className="bh-sticky-1" scope="col">
                Scenario
              </th>
              <th className="bh-sticky-2" scope="col">
                Group
              </th>
              {orderedLibraries.map((lib) => (
                <th
                  className="bh-num"
                  key={lib.key}
                  scope="col"
                  style={{ color: paletteMap[lib.key]?.text }}
                >
                  {lib.displayName}
                </th>
              ))}
              {compareLibs.map((cmp) => (
                <th className="bh-num text-bh-ratio-accent" key={cmp.key} scope="col">
                  ÷ {cmp.displayName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshotRows.map((row) => (
              <tr key={row.id}>
                <td className="bh-sticky-1">{row.id}</td>
                <td className="bh-sticky-2">{row.group}</td>
                {row.hzCells.map((cell, i) => (
                  <td className="bh-num" key={i}>
                    {cell}
                  </td>
                ))}
                {row.ratioCells.map((cell, i) => (
                  <td className="bh-num" key={i}>
                    {cell}
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
