import { useEffect, useMemo } from "react";

import { PALETTE } from "#/app/lib/colors";
import type { PaletteEntry } from "#/app/lib/colors";
import { searchNorm } from "#/app/lib/format";
import type { ViewState } from "#/app/lib/hash";
import { buildMetrics, buildSnapshotRow, pickDefaultScenarioId } from "#/app/lib/metrics";
import type { MetricsResult, SnapshotRow } from "#/app/lib/metrics";
import type { EmbeddedLibraryMeta, EmbeddedRun, EmbeddedScenarioSeries, EmbeddedViewerPayload } from "#/types";

interface DerivedPayloadOptions {
  payload: EmbeddedViewerPayload | null;
  view: ViewState;
  patchView: (patch: Partial<ViewState>) => void;
}

/**
 * Filtered, ordered, and aggregated data derived from the payload and the current view.
 *
 * @since 0.3.16-canary.3
 */
export interface DerivedPayload {
  orderedLibraries: Array<EmbeddedLibraryMeta>;
  paletteMap: Record<string, PaletteEntry>;
  visibleScenarios: Array<EmbeddedScenarioSeries>;
  baseRunIndices: Array<number>;
  runIndices: Array<number>;
  /** The windowed runs where at least one library measured the current scenario — what the chart plots. */
  chartRunIndices: Array<number>;
  /** The ordered libraries with data in the plotted window — what the chart and metrics render. */
  chartLibraries: Array<EmbeddedLibraryMeta>;
  /** The compare libraries with data in the plotted window. */
  chartCompareLibs: Array<EmbeddedLibraryMeta>;
  currentScenario: EmbeddedScenarioSeries | null;
  uniqueEnvKeys: Array<string>;
  envLabelMap: Record<string, string>;
  uniqueGroups: Array<string>;
  primaryLib: EmbeddedLibraryMeta | undefined;
  compareLibs: Array<EmbeddedLibraryMeta>;
  scenarioIndex: number;
  showMultiEnvBanner: boolean;
  metricsData: MetricsResult | null;
  snapshotRows: Array<SnapshotRow>;
  latestRun: EmbeddedRun | undefined;
}

/**
 * Derives library order, filtered scenarios and runs, metrics, and snapshot rows from the payload and view.
 *
 * @since 0.3.16-canary.3
 */
export function useDerivedPayload({ payload, view, patchView }: DerivedPayloadOptions): DerivedPayload {
  const { orderedLibraries, paletteMap, primaryLib, compareLibs } = useMemo<{
    orderedLibraries: Array<EmbeddedLibraryMeta>;
    paletteMap: Record<string, PaletteEntry>;
    primaryLib: EmbeddedLibraryMeta | undefined;
    compareLibs: Array<EmbeddedLibraryMeta>;
  }>(() => {
    if (!payload) {
      return { orderedLibraries: [], paletteMap: {}, primaryLib: undefined, compareLibs: [] };
    }
    // The server names the primary in the payload — deriving it again from isPrimary could disagree.
    const primary =
      payload.libraries.find((lib) => lib.key === payload.primaryLibraryKey) ??
      payload.libraries.find((lib) => lib.isPrimary) ??
      payload.libraries[0];
    const compares = payload.libraries.filter((lib) => lib.key !== primary?.key);
    const ordered: Array<EmbeddedLibraryMeta> = primary ? [primary, ...compares] : [...payload.libraries];
    const paletteMap: Record<string, PaletteEntry> = {};
    ordered.forEach((lib, paletteIndex) => {
      paletteMap[lib.key] = PALETTE[paletteIndex % PALETTE.length]!;
    });
    return { orderedLibraries: ordered, paletteMap, primaryLib: primary, compareLibs: compares };
  }, [payload]);

  const visibleScenarios = useMemo<Array<EmbeddedScenarioSeries>>(() => {
    if (!payload) {
      return [];
    }
    const normalizedQuery = searchNorm(view.search).trim();
    return payload.scenarios.filter((scenario) => {
      if (view.group && scenario.group !== view.group) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return (
        searchNorm(scenario.id).includes(normalizedQuery) ||
        searchNorm(scenario.group).includes(normalizedQuery) ||
        searchNorm(scenario.what).includes(normalizedQuery)
      );
    });
  }, [payload, view.group, view.search]);

  const baseRunIndices = useMemo<Array<number>>(() => {
    if (!payload) {
      return [];
    }
    if (!view.envKey) {
      return payload.runs.map((_, runIndex) => runIndex);
    }
    return payload.runs.reduce<Array<number>>((acc, r, i) => {
      if (r.envKey === view.envKey) {
        acc.push(i);
      }
      return acc;
    }, []);
  }, [payload, view.envKey]);

  const runIndices = useMemo<Array<number>>(() => {
    if (view.runWindow === "all" || baseRunIndices.length === 0) {
      return baseRunIndices;
    }
    const runWindowLimit = parseInt(view.runWindow, 10);
    if (!Number.isFinite(runWindowLimit) || runWindowLimit < 1) {
      return baseRunIndices;
    }
    return baseRunIndices.length <= runWindowLimit
      ? baseRunIndices
      : baseRunIndices.slice(baseRunIndices.length - runWindowLimit);
  }, [baseRunIndices, view.runWindow]);

  const currentScenario = useMemo<EmbeddedScenarioSeries | null>(() => {
    if (!payload) {
      return null;
    }
    return payload.scenarios.find((scenario) => scenario.id === view.scenarioId) ?? null;
  }, [payload, view.scenarioId]);

  // A run without data for this scenario carries no point — hiding it keeps the plotted line connected.
  const chartRunIndices = useMemo<Array<number>>(() => {
    if (!currentScenario) {
      return runIndices;
    }
    const libraryData = Object.values(currentScenario.libraries);
    return runIndices.filter((globalIx) => libraryData.some((lib) => lib.hz[globalIx] !== null));
  }, [currentScenario, runIndices]);

  // A library with no data in the plotted window would add only dead cards, columns, and legend rows.
  const { chartLibraries, chartCompareLibs, inactiveLibraryNames } = useMemo<{
    chartLibraries: Array<EmbeddedLibraryMeta>;
    chartCompareLibs: Array<EmbeddedLibraryMeta>;
    inactiveLibraryNames: Array<string>;
  }>(() => {
    if (!currentScenario) {
      return { chartLibraries: orderedLibraries, chartCompareLibs: compareLibs, inactiveLibraryNames: [] };
    }
    const active: Array<EmbeddedLibraryMeta> = [];
    const inactive: Array<string> = [];
    for (const lib of orderedLibraries) {
      const libData = currentScenario.libraries[lib.key];
      const hasData = libData !== undefined && chartRunIndices.some((globalIx) => libData.hz[globalIx] !== null);
      if (hasData) {
        active.push(lib);
      } else {
        inactive.push(lib.displayName);
      }
    }
    const activeKeys = new Set(active.map((lib) => lib.key));
    return {
      chartLibraries: active,
      chartCompareLibs: compareLibs.filter((lib) => activeKeys.has(lib.key)),
      inactiveLibraryNames: inactive,
    };
  }, [currentScenario, chartRunIndices, orderedLibraries, compareLibs]);

  const uniqueEnvKeys = useMemo<Array<string>>(() => {
    if (!payload) {
      return [];
    }
    return [...new Set(payload.runs.map((run) => run.envKey))].toSorted((left, right) => left.localeCompare(right));
  }, [payload]);

  const envLabelMap = useMemo<Record<string, string>>(() => {
    if (!payload) {
      return {};
    }
    const map: Record<string, string> = {};
    for (const run of payload.runs) {
      if (!(run.envKey in map)) {
        map[run.envKey] = run.envLabel ?? run.envKey;
      }
    }
    return map;
  }, [payload]);

  const uniqueGroups = useMemo<Array<string>>(() => {
    if (!payload) {
      return [];
    }
    return [...new Set(payload.scenarios.map((scenario) => scenario.group))].toSorted((a, b) => a.localeCompare(b));
  }, [payload]);

  const scenarioIndex = visibleScenarios.findIndex((scenario) => scenario.id === view.scenarioId);
  const showMultiEnvBanner = uniqueEnvKeys.length > 1 && !view.envKey;

  // Auto-select a scenario when none is visible: the richest one on first load (nothing chosen
  // yet), the first match after a filter change.
  useEffect(() => {
    if (!payload || visibleScenarios.length === 0) {
      return;
    }
    const isVisible = visibleScenarios.some((scenario) => scenario.id === view.scenarioId);
    if (!isVisible) {
      patchView({
        scenarioId: view.scenarioId === "" ? pickDefaultScenarioId(visibleScenarios) : (visibleScenarios[0]?.id ?? ""),
      });
    }
  }, [payload, visibleScenarios, view.scenarioId, patchView]);

  const metricsData = useMemo<MetricsResult | null>(() => {
    if (!currentScenario || chartRunIndices.length === 0) {
      return null;
    }
    return buildMetrics({
      scenario: currentScenario,
      runIndices: chartRunIndices,
      windowedRunCount: runIndices.length,
      inactiveLibraryNames,
      orderedLibraries: chartLibraries,
      paletteMap,
      primaryLib,
      compareLibs: chartCompareLibs,
      baseRunIndices,
      envKey: view.envKey,
      runWindow: view.runWindow,
    });
  }, [
    currentScenario,
    chartRunIndices,
    runIndices.length,
    inactiveLibraryNames,
    chartLibraries,
    paletteMap,
    primaryLib,
    chartCompareLibs,
    baseRunIndices,
    view.envKey,
    view.runWindow,
  ]);

  const snapshotRows = useMemo<Array<SnapshotRow>>(() => {
    if (!payload || payload.runs.length === 0) {
      return [];
    }
    return payload.scenarios.map((scenario) =>
      buildSnapshotRow(scenario, payload.runs, orderedLibraries, primaryLib, compareLibs),
    );
  }, [payload, orderedLibraries, primaryLib, compareLibs]);

  const latestRun = payload?.runs[payload.runs.length - 1];

  return {
    orderedLibraries,
    paletteMap,
    visibleScenarios,
    baseRunIndices,
    runIndices,
    chartRunIndices,
    chartLibraries,
    chartCompareLibs,
    currentScenario,
    uniqueEnvKeys,
    envLabelMap,
    uniqueGroups,
    primaryLib,
    compareLibs,
    scenarioIndex,
    showMultiEnvBanner,
    metricsData,
    snapshotRows,
    latestRun,
  };
}
