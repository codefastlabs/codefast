import type { ComponentProps } from "react";

import { DisclosurePanel } from "#app/components/disclosure-panel";
import type { PaletteEntry } from "#app/lib/colors";
import { formatLocal } from "#app/lib/format";
import type { SnapshotRow } from "#app/lib/metrics";
import { cn } from "#app/lib/utils";
import type { EmbeddedLibraryMeta, EmbeddedRun } from "#types";

function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b-bh-table-line bg-bh-table-head text-bh-label text-bh-caption sticky top-0 z-3 border-b px-[0.65rem] py-[0.15rem] text-start font-semibold whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "border-b-bh-table-line border-b px-[0.65rem] py-[0.15rem] text-start whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

interface SnapshotSectionProps {
  runCount: number;
  orderedLibraries: Array<EmbeddedLibraryMeta>;
  compareLibs: Array<EmbeddedLibraryMeta>;
  paletteMap: Record<string, PaletteEntry>;
  snapshotRows: Array<SnapshotRow>;
  latestRun: EmbeddedRun | undefined;
}

/**
 * Renders the collapsible table of each scenario's newest measured throughput and ratios.
 *
 * @since 0.3.16-canary.3
 */
export function SnapshotSection({
  runCount,
  orderedLibraries,
  compareLibs,
  paletteMap,
  snapshotRows,
  latestRun,
}: SnapshotSectionProps) {
  return (
    <DisclosurePanel className="mt-6" id="snapshot-details" summary="Latest measurement per scenario">
      <p className="text-bh-small text-bh-label-muted mb-3 leading-relaxed" id="snapshot-desc">
        Each cell uses that library's newest run with data ({runCount} runs scanned), whatever the Environment filter —
        so a ratio can pair values from different runs. As of is the newest run that contributed to the row.
      </p>
      {/* Its own scroll box, so the header row stays in view down every scenario. */}
      <div className="border-bh-border bg-bh-scrim-table max-h-[min(36rem,70dvh)] overflow-auto overscroll-contain rounded-xl border [-webkit-overflow-scrolling:touch]">
        <table
          aria-describedby="snapshot-desc"
          aria-label="Latest run throughput by scenario"
          className="text-bh-small w-full border-collapse tabular-nums"
        >
          <thead>
            <tr>
              <Th
                className="bg-bh-table-sticky sticky start-0 z-4 min-w-30 shadow-[0.0625rem_0_0_var(--color-bh-border-strong)]"
                scope="col"
              >
                Scenario
              </Th>
              {/* The id already leads with its group, so a phone spends the width on numbers instead. */}
              <Th className="max-sm:hidden" scope="col">
                Group
              </Th>
              {orderedLibraries.map((lib) => (
                <Th
                  className="text-end tabular-nums"
                  key={lib.key}
                  scope="col"
                  style={{ color: paletteMap[lib.key]?.text }}
                >
                  {lib.displayName}
                </Th>
              ))}
              {compareLibs.map((cmp) => (
                <Th className="text-bh-ratio-accent text-end tabular-nums" key={cmp.key} scope="col">
                  ÷ {cmp.displayName}
                </Th>
              ))}
              <Th className="text-end whitespace-nowrap" scope="col">
                As of
              </Th>
            </tr>
          </thead>
          <tbody>
            {snapshotRows.map((row) => (
              <tr
                className="group hover:bg-bh-table-hover even:bg-bh-table-zebra even:hover:bg-bh-table-zebra-hover"
                key={row.id}
              >
                <Td className="bg-bh-table-sticky group-hover:bg-bh-table-sticky-hover group-even:bg-bh-table-sticky-zebra group-even:group-hover:bg-bh-table-sticky-zebra-hover sticky start-0 z-2 min-w-30 shadow-[0.0625rem_0_0_var(--color-bh-border-strong)]">
                  {row.id}
                </Td>
                <Td className="text-bh-label max-sm:hidden">{row.group}</Td>
                {row.hzCells.map((hzCell, cellIndex) => (
                  <Td className="text-end tabular-nums" key={cellIndex}>
                    {hzCell}
                  </Td>
                ))}
                {row.ratioCells.map((ratioCell, cellIndex) => (
                  <Td className="text-end tabular-nums" key={cellIndex}>
                    {ratioCell}
                  </Td>
                ))}
                <Td className="text-bh-label-muted text-end whitespace-nowrap" suppressHydrationWarning>
                  {row.asOf}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {latestRun && (
        <div className="text-bh-caption text-bh-label-muted mt-2" suppressHydrationWarning>
          Folder {latestRun.folder} · {formatLocal(latestRun.timestampIso, latestRun.folder)} (local)
        </div>
      )}
    </DisclosurePanel>
  );
}
