import type { ComparisonCompetitorSummary, ComparisonLibrary } from "#/report/comparison";
import { buildComparisonRows, summarizeComparison } from "#/report/comparison";
import { isIqrNoisy, isRatioUnreliable } from "#/report/reliability";
import {
  BENCH_ISOLATE_ENV_KEY,
  BENCH_ONLY_ENV_KEY,
  isEnvFlagEnabled,
  parseScenarioFilter,
  resolveBenchModeFromEnvironment,
} from "#/shared/env-keys";

/**
 * Shape of {@link ComparisonDocument}, so a reader of an older run directory can tell that the file
 * it found is not the file it expects.
 *
 * @remarks Bumped whenever a field changes meaning or leaves — run directories are kept for
 * historical comparison, and a silently reinterpreted field is the failure this exists to prevent.
 *
 * @since 0.6.0
 */
export const COMPARISON_DOCUMENT_SCHEMA_VERSION = 2;

/**
 * How the run was invoked, so a reader can tell a publishable run from a smoke or narrowed one.
 *
 * @remarks Without this a filtered run is indistinguishable from a whole suite except by row count,
 * which only helps a reader who already knows how many rows the suite has.
 *
 * @since 0.6.0
 */
export interface ComparisonDocumentRun {
  /** Basename of this run's directory — the exact key joining a `latest.*` mirror to its run. */
  readonly runId: string;
  readonly mode: "default" | "fast" | "full";
  readonly isolated: boolean;
  /**
   * Ids requested through `BENCH_ONLY`, or `null` when the whole suite ran.
   *
   * @remarks Null rather than absent: `JSON.stringify` drops an undefined property, and a reader
   * cannot tell a key that means "no filter" from one this writer forgot.
   */
  readonly scenarioFilter: ReadonlyArray<string> | null;
  readonly trialCount: number;
  readonly scenariosMeasured: number;
  /** Rows the subject collects, filtered or not; above `scenariosMeasured` means a partial run. */
  readonly scenariosAvailable: number;
  /** How the parent scheduled the libraries, which decides whether a cross-library ratio is citable. */
  readonly runOrder: string | null;
}

/**
 * What a suite has to supply; the rest of {@link ComparisonDocumentRun} comes from the environment.
 *
 * @since 0.6.0
 */
export interface ComparisonDocumentRunInput {
  readonly runId: string;
  readonly runOrder?: string | undefined;
  /** Every row the subject collects — `SubprocessPayload.scenarioIds`, not the measured subset. */
  readonly scenariosAvailable?: number | undefined;
}

/**
 * Machine and runtime the whole run shared.
 *
 * @since 0.6.0
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
 *
 * @since 0.6.0
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
 *
 * @since 0.6.0
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
 *
 * @since 0.6.0
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
 *
 * @since 0.6.0
 */
export interface ComparisonDocument {
  readonly schemaVersion: number;
  readonly run: ComparisonDocumentRun;
  readonly environment: ComparisonDocumentEnvironment;
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
 * @param pivot - The suite's subject; its fingerprint stamps the document.
 * @param competitors - Every other measured library, in report order.
 * @param run - Identity and scheduling the parent knows; the profile and filter come from the env.
 *
 * @since 0.6.0
 */
export function buildComparisonDocument(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  run: ComparisonDocumentRunInput,
): ComparisonDocument {
  const { fingerprint } = pivot.report;
  const scenarioFilter = parseScenarioFilter(process.env[BENCH_ONLY_ENV_KEY]);
  const scenariosMeasured = pivot.report.scenarios.length;
  return {
    schemaVersion: COMPARISON_DOCUMENT_SCHEMA_VERSION,
    run: {
      runId: run.runId,
      mode: resolveBenchModeFromEnvironment() ?? "default",
      isolated: isEnvFlagEnabled(BENCH_ISOLATE_ENV_KEY),
      scenarioFilter: scenarioFilter === undefined ? null : [...scenarioFilter],
      trialCount: pivot.report.trialCount,
      scenariosMeasured,
      scenariosAvailable: run.scenariosAvailable ?? scenariosMeasured,
      runOrder: run.runOrder ?? null,
    },
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
