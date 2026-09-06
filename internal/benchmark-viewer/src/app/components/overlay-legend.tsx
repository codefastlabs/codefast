import { OVERLAY_DASHES, OVERLAY_POINT_STYLES } from "#/app/lib/colors";
import type { PaletteEntry } from "#/app/lib/colors";
import { fmtHzCompact, fmtRatio } from "#/app/lib/format";
import { ratioFrom } from "#/app/lib/metrics";
import type { OverlaySeries } from "#/app/lib/overlay";
import { rowShortLabel } from "#/app/lib/overlay";
import { cn } from "#/app/lib/utils";
import type { EmbeddedLibraryMeta, EmbeddedScenarioSeries } from "#/types";

interface OverlayLegendProps {
  hiddenRows: ReadonlyArray<string>;
  libraries: ReadonlyArray<EmbeddedLibraryMeta>;
  onHoverRow: (scenarioId: string | null) => void;
  onSelectRow: (scenarioId: string) => void;
  onToggleRow: (scenarioId: string) => void;
  paletteMap: Readonly<Record<string, PaletteEntry>>;
  rows: ReadonlyArray<EmbeddedScenarioSeries>;
  selectedScenarioId: string;
  series: ReadonlyArray<OverlaySeries>;
}

/** The newest plotted value of one line, or `null` when it never drew. */
function latestValue(series: OverlaySeries | undefined): number | null {
  if (series === undefined) {
    return null;
  }
  for (let index = series.data.length - 1; index >= 0; index--) {
    const value = series.data[index];
    if (typeof value === "number") {
      return value;
    }
  }
  return null;
}

function RowGlyph({
  dash,
  pointStyle,
}: {
  dash: ReadonlyArray<number>;
  pointStyle: (typeof OVERLAY_POINT_STYLES)[number];
}) {
  const marker = (() => {
    switch (pointStyle) {
      case "triangle":
        return <polygon fill="currentColor" points="14,1 18,8 10,8" />;
      case "rect":
        return <rect fill="currentColor" height="7" width="7" x="10.5" y="0.5" />;
      case "rectRot":
        return <polygon fill="currentColor" points="14,0 18,4 14,8 10,4" />;
      default:
        return <circle cx="14" cy="4" fill="currentColor" r="3.5" />;
    }
  })();
  return (
    <svg aria-hidden="true" className="shrink-0 text-zinc-300" height="8" viewBox="0 0 28 8" width="28">
      <line
        stroke="currentColor"
        strokeDasharray={dash.length > 0 ? dash.join(" ") : undefined}
        strokeWidth="2"
        x1="0"
        x2="28"
        y1="4"
        y2="4"
      />
      {marker}
    </svg>
  );
}

/**
 * Renders the group overlay's legend as a table: one row per scenario of the group with its dash
 * pattern and marker shape, one column per library with its colour, each cell swatched in the shade
 * that row takes in that library's family and showing the newest value and its ratio to the selected
 * row's same-library value.
 *
 * @remarks Clicking a row name selects it, the trailing checkbox hides it, and hovering a row lifts
 * its lines on the chart.
 */
export function OverlayLegend({
  hiddenRows,
  libraries,
  onHoverRow,
  onSelectRow,
  onToggleRow,
  paletteMap,
  rows,
  selectedScenarioId,
  series,
}: OverlayLegendProps) {
  const seriesOf = (scenarioId: string, libraryKey: string) =>
    series.find((line) => line.scenarioId === scenarioId && line.libraryKey === libraryKey);
  const drawnLibraries = libraries.filter((library) => series.some((line) => line.libraryKey === library.key));

  return (
    <div className="border-bh-border bg-bh-scrim-table mt-4 overflow-x-auto rounded-xl border [-webkit-overflow-scrolling:touch]">
      <table
        aria-label="Rows of the overlaid group and their newest values per library"
        className="w-full border-collapse text-[0.8rem]"
      >
        <thead>
          <tr>
            <th
              className="text-bh-label px-3 py-1.5 text-start text-[0.7rem] font-semibold tracking-wider uppercase"
              scope="col"
            >
              Row
            </th>
            {drawnLibraries.map((library) => (
              <th
                className="text-bh-label px-3 py-1.5 text-end text-[0.7rem] font-semibold tracking-wider whitespace-nowrap uppercase"
                key={library.key}
                scope="col"
              >
                <span
                  aria-hidden="true"
                  className="me-1.5 inline-block size-2 rounded-full align-middle"
                  style={{ backgroundColor: paletteMap[library.key]?.border }}
                />
                {library.displayName}
              </th>
            ))}
            <th
              className="text-bh-label px-3 py-1.5 text-end text-[0.7rem] font-semibold tracking-wider uppercase"
              scope="col"
            >
              Drawn
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const isSelected = row.id === selectedScenarioId;
            const isDrawn = isSelected || !hiddenRows.includes(row.id);
            const shortLabel = rowShortLabel(row.id, row.group);
            return (
              <tr
                className={cn(
                  "hover:bg-bh-table-hover border-t border-white/6",
                  isSelected && "bg-bh-blue/10",
                  !isDrawn && "text-zinc-500",
                )}
                key={row.id}
                onMouseEnter={() => onHoverRow(isDrawn ? row.id : null)}
                onMouseLeave={() => onHoverRow(null)}
              >
                <th className="px-3 py-1.5 text-start font-medium" scope="row">
                  <button
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "focus-visible:outline-bh-blue inline-flex items-center gap-2 rounded-md text-start focus-visible:outline focus-visible:outline-offset-2",
                      isSelected ? "text-zinc-50" : "text-zinc-300 hover:text-zinc-50",
                      !isDrawn && "line-through",
                    )}
                    onClick={() => onSelectRow(row.id)}
                    title={isSelected ? "The selected row" : `Select ${row.id}`}
                    type="button"
                  >
                    <RowGlyph
                      dash={OVERLAY_DASHES[rowIndex % OVERLAY_DASHES.length]!}
                      pointStyle={OVERLAY_POINT_STYLES[rowIndex % OVERLAY_POINT_STYLES.length]!}
                    />
                    {shortLabel}
                  </button>
                </th>
                {drawnLibraries.map((library) => {
                  const line = seriesOf(row.id, library.key);
                  const value = latestValue(line);
                  const selectedValue = latestValue(seriesOf(selectedScenarioId, library.key));
                  const ratio = isSelected ? null : ratioFrom(value, selectedValue);
                  return (
                    <td className="px-3 py-1.5 text-end whitespace-nowrap tabular-nums" key={library.key}>
                      {line !== undefined && (
                        <span
                          aria-hidden="true"
                          className="me-1.5 inline-block size-2 rounded-sm align-middle"
                          style={{ backgroundColor: line.color }}
                        />
                      )}
                      {value === null ? "—" : fmtHzCompact(value)}
                      {ratio !== null && (
                        <span
                          className="text-bh-ratio-accent ms-1.5 text-[0.72rem]"
                          title="Ratio to the selected row, same library"
                        >
                          {fmtRatio(ratio)}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-1.5 text-end">
                  <input
                    aria-label={`Draw ${row.id}`}
                    checked={isDrawn}
                    className="text-bh-blue accent-bh-blue focus:ring-bh-blue/50 size-4 rounded border-white/20 bg-black/30 focus:ring-2 focus:outline-none disabled:opacity-40"
                    disabled={isSelected}
                    onChange={() => onToggleRow(row.id)}
                    title={
                      isSelected ? "The selected row is always drawn" : isDrawn ? "Hide this row" : "Draw this row"
                    }
                    type="checkbox"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
