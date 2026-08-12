import type { ComparisonCompetitorSummary, ComparisonLibrary } from "#/report/comparison";
import { buildComparisonRows, summarizeComparison } from "#/report/comparison";
import { isIqrNoisy, isRatioUnreliable } from "#/report/reliability";

/**
 * Shape of {@link ComparisonDocument}, so a reader of an older run directory can tell that the file
 * it found is not the file it expects.
 *
 * @remarks Bumped whenever a field changes meaning or leaves — run directories are kept for
 * historical comparison, and a silently reinterpreted field is the failure this exists to prevent.
 */
export const COMPARISON_DOCUMENT_SCHEMA_VERSION = 1;

/**
 * Machine and runtime the whole run shared.
 */
export interface ComparisonDocumentEnvironment {
  readonly nodeVersion: string;
  readonly v8Version: string;
  readonly platform: string;
  readonly arch: string;
  readonly cpuModel: string;
  readonly cpuCount: number;
  readonly nodeOptions: string;
  readonly gcExposed: boolean;
  readonly timestampIso: string;
}

/**
 * One library that took part, at the version it was measured at.
 */
export interface ComparisonDocumentLibrary {
  readonly libraryName: string;
  readonly libraryVersion: string;
  readonly displayName: string;
  readonly trialCount: number;
  readonly sanityFailures: ReadonlyArray<string>;
}

/**
 * One competitor's cell for one scenario, with the reliability verdicts resolved.
 *
 * @remarks The markdown report spends these as `†`/`‡` glyphs against thresholds only the renderer
 * knows; here they are booleans, so a reader never has to reproduce a threshold to filter on it.
 */
export interface ComparisonDocumentCell {
  readonly displayName: string;
  readonly hzPerOp: number;
  /** Pivot over competitor throughput; 0 when either side never measured the scenario. */
  readonly ratio: number;
  readonly iqrFraction: number;
  readonly isRatioUnreliable: boolean;
  readonly isIqrNoisy: boolean;
}

/**
 * One scenario row at full precision, as opposed to the markdown table's rounded figures.
 */
export interface ComparisonDocumentScenario {
  readonly id: string;
  readonly group: string;
  readonly batch: number;
  readonly what: string;
  readonly stress: boolean;
  readonly excludeFromAggregates: boolean;
  readonly pivotTrialsIncluded: number;
  readonly pivotHzPerOp: number;
  readonly pivotIqrFraction: number;
  readonly isPivotIqrNoisy: boolean;
  readonly competitors: ReadonlyArray<ComparisonDocumentCell>;
}

/**
 * The comparison a run computed, as data rather than as a rendered table.
 *
 * @remarks Every figure here already existed on the way to `report.md`; the markdown keeps only a
 * rounded, glyph-annotated projection of it, which is lossy for a ratio and awkward to read back.
 */
export interface ComparisonDocument {
  readonly schemaVersion: number;
  readonly environment: ComparisonDocumentEnvironment;
  /** How the parent scheduled the libraries, which decides whether a cross-library ratio is citable. */
  readonly runOrder: string | undefined;
  readonly pivot: ComparisonDocumentLibrary;
  readonly competitors: ReadonlyArray<ComparisonDocumentLibrary>;
  readonly scenarios: ReadonlyArray<ComparisonDocumentScenario>;
  readonly headToHead: ReadonlyArray<ComparisonCompetitorSummary>;
}

function toDocumentLibrary(library: ComparisonLibrary): ComparisonDocumentLibrary {
  return {
    libraryName: library.report.fingerprint.libraryName,
    libraryVersion: library.report.fingerprint.libraryVersion,
    displayName: library.displayName,
    trialCount: library.report.trialCount,
    sanityFailures: library.report.sanityFailures,
  };
}

/**
 * Serialises the comparison the console and markdown reports render.
 *
 * @param runOrder - The parent's scheduling policy; a child cannot know it.
 */
export function buildComparisonDocument(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  runOrder?: string,
): ComparisonDocument {
  const { fingerprint } = pivot.report;
  return {
    schemaVersion: COMPARISON_DOCUMENT_SCHEMA_VERSION,
    environment: {
      nodeVersion: fingerprint.nodeVersion,
      v8Version: fingerprint.v8Version,
      platform: fingerprint.platform,
      arch: fingerprint.arch,
      cpuModel: fingerprint.cpuModel,
      cpuCount: fingerprint.cpuCount,
      nodeOptions: fingerprint.nodeOptions,
      gcExposed: fingerprint.gcExposed,
      timestampIso: fingerprint.timestampIso,
    },
    runOrder,
    pivot: toDocumentLibrary(pivot),
    competitors: competitors.map(toDocumentLibrary),
    scenarios: buildComparisonRows(pivot, competitors).map((row) => ({
      id: row.id,
      group: row.group,
      batch: row.batch,
      what: row.what,
      stress: row.stress,
      excludeFromAggregates: row.excludeFromAggregates,
      pivotTrialsIncluded: row.pivotTrialsIncluded,
      pivotHzPerOp: row.pivotHzPerOp,
      pivotIqrFraction: row.pivotIqrFraction,
      isPivotIqrNoisy: isIqrNoisy(row.pivotIqrFraction),
      competitors: row.competitors.map((cell, competitorIndex) => ({
        displayName: competitors[competitorIndex]?.displayName ?? "",
        hzPerOp: cell.hzPerOp,
        ratio: cell.ratio,
        iqrFraction: cell.iqrFraction,
        isRatioUnreliable: isRatioUnreliable(row.pivotHzPerOp, cell.hzPerOp),
        isIqrNoisy: isIqrNoisy(cell.iqrFraction),
      })),
    })),
    headToHead: summarizeComparison(pivot, competitors),
  };
}
