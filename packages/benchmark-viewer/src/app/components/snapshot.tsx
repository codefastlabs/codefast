import type { ComponentProps } from "react";
import type { PaletteEntry } from "#/app/lib/colors";
import { formatLocal } from "#/app/lib/format";
import type { SnapshotRow } from "#/app/lib/metrics";
import { cn } from "#/app/lib/utils";
import type { EmbeddedLibraryMeta, EmbeddedRun } from "#/types";

function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "z-3",
        "px-[0.65rem] py-[0.15rem]",
        "border-b-bh-table-line border-b",
        "bg-bh-table-head text-bh-label text-left text-[0.7rem] font-semibold tracking-wider whitespace-nowrap uppercase",
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
        "px-[0.65rem] py-[0.15rem]",
        "border-b-bh-table-line border-b",
        "text-left",
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
    <details
      className={cn(
        "mt-10 px-5 py-4",
        "border-bh-border rounded-[1.25rem] border",
        "bg-bh-surface",
        "backdrop-blur-xl backdrop-saturate-180",
        "open:bg-bh-surface-open-muted",
        "sm:px-6",
      )}
      id="snapshot-details"
    >
      <summary
        className={cn(
          "py-1",
          "list-none text-sm leading-snug font-semibold text-zinc-100",
          "cursor-pointer",
          "marker:content-['']",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        Snapshot of <span className="text-cyan-200/90">globally newest</span> bench folder —
        throughput by scenario (table)
      </summary>
      <p className={cn("mb-3", "text-xs leading-relaxed text-zinc-500")} id="snapshot-desc">
        Rows use the chronologically last run directory ({runCount} total), independent of the
        Environment selector.
      </p>
      <div
        className={cn(
          "overflow-x-auto",
          "border-bh-border rounded-xl border",
          "bg-bh-scrim-table",
          "[-webkit-overflow-scrolling:touch]",
        )}
      >
        <table
          aria-label="Latest run throughput by scenario"
          className={cn("w-full", "border-collapse", "text-[0.8rem]")}
        >
          <thead>
            <tr>
              <Th
                className={cn(
                  "sticky left-0 z-2",
                  "max-w-56 min-w-30",
                  "bg-bh-table-sticky shadow-[0.0625rem_0_0_var(--color-bh-border-strong)]",
                )}
                scope="col"
              >
                Scenario
              </Th>
              <Th
                className={cn(
                  "sticky left-30 z-2",
                  "min-w-20",
                  "bg-bh-table-sticky shadow-[0.0625rem_0_0_var(--color-bh-border-strong)]",
                )}
                scope="col"
              >
                Group
              </Th>
              {orderedLibraries.map((lib) => (
                <Th
                  className="text-right tabular-nums"
                  key={lib.key}
                  scope="col"
                  style={{ color: paletteMap[lib.key]?.text }}
                >
                  {lib.displayName}
                </Th>
              ))}
              {compareLibs.map((cmp) => (
                <Th
                  className="text-bh-ratio-accent text-right tabular-nums"
                  key={cmp.key}
                  scope="col"
                >
                  ÷ {cmp.displayName}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshotRows.map((row) => (
              <tr
                className={cn(
                  "hover:bg-bh-table-hover",
                  "even:bg-bh-table-zebra",
                  "even:hover:bg-bh-table-zebra-hover",
                )}
                key={row.id}
              >
                <Td
                  className={cn(
                    "sticky left-0 z-2",
                    "max-w-56 min-w-30",
                    "bg-bh-table-sticky shadow-[0.0625rem_0_0_var(--color-bh-border-strong)]",
                  )}
                >
                  {row.id}
                </Td>
                <Td
                  className={cn(
                    "sticky left-30 z-2",
                    "min-w-20",
                    "bg-bh-table-sticky shadow-[0.0625rem_0_0_var(--color-bh-border-strong)]",
                  )}
                >
                  {row.group}
                </Td>
                {row.hzCells.map((hzCell, cellIndex) => (
                  <Td className="text-right tabular-nums" key={cellIndex}>
                    {hzCell}
                  </Td>
                ))}
                {row.ratioCells.map((ratioCell, cellIndex) => (
                  <Td className="text-right tabular-nums" key={cellIndex}>
                    {ratioCell}
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {latestRun && (
        <div className={cn("mt-2", "text-xs text-zinc-600")} suppressHydrationWarning>
          Folder {latestRun.folder} · {formatLocal(latestRun.timestampIso, latestRun.folder)}{" "}
          (local)
        </div>
      )}
    </details>
  );
}
