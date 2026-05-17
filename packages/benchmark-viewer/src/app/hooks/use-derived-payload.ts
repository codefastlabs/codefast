import { useEffect, useMemo } from "react";
import { type PaletteEntry, PALETTE } from "#/app/lib/colors";
import { searchNorm } from "#/app/lib/format";
import { type ViewState } from "#/app/lib/hash";
import {
  buildMetrics,
  buildSnapshotRow,
  type MetricsResult,
  type SnapshotRow,
} from "#/app/lib/metrics";
import type {
  EmbeddedLibraryMeta,
  EmbeddedRun,
  EmbeddedScenarioSeries,
  EmbeddedViewerPayload,
} from "#/types";

interface DerivedPayloadOptions {
  payload: EmbeddedViewerPayload | null;
  view: ViewState;
  patchView: (patch: Partial<ViewState>) => void;
}

/**
 * @since 0.3.16-canary.3
 */
export interface DerivedPayload {
  orderedLibraries: Array<EmbeddedLibraryMeta>;
  paletteMap: Record<string, PaletteEntry>;
  visibleScenarios: Array<EmbeddedScenarioSeries>;
  baseRunIndices: Array<number>;
  runIndices: Array<number>;
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
 * @since 0.3.16-canary.3
 */
export function useDerivedPayload({
  payload,
  view,
  patchView,
}: DerivedPayloadOptions): DerivedPayload {
  const { orderedLibraries, paletteMap } = useMemo<{
    orderedLibraries: Array<EmbeddedLibraryMeta>;
    paletteMap: Record<string, PaletteEntry>;
  }>(() => {
    if (!payload) {
      return { orderedLibraries: [], paletteMap: {} };
    }
    const primary = payload.libraries.find((lib) => lib.isPrimary) ?? payload.libraries[0];
    const compares = payload.libraries.filter((lib) => !lib.isPrimary);
    const ordered: Array<EmbeddedLibraryMeta> = primary
      ? [primary, ...compares]
      : [...payload.libraries];
    const paletteMap: Record<string, PaletteEntry> = {};
    ordered.forEach((lib, paletteIndex) => {
      paletteMap[lib.key] = PALETTE[paletteIndex % PALETTE.length]!;
    });
    return { orderedLibraries: ordered, paletteMap };
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

  const uniqueEnvKeys = useMemo<Array<string>>(() => {
    if (!payload) {
      return [];
    }
    return [...new Set(payload.runs.map((run) => run.envKey))].sort((left, right) =>
      left.localeCompare(right),
    );
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
    return [...new Set(payload.scenarios.map((scenario) => scenario.group))].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [payload]);

  const primaryLib = useMemo(
    () => orderedLibraries.find((lib) => lib.isPrimary) ?? orderedLibraries[0],
    [orderedLibraries],
  );

  const compareLibs = useMemo(
    () => orderedLibraries.filter((lib) => !lib.isPrimary),
    [orderedLibraries],
  );

  const scenarioIndex = visibleScenarios.findIndex((scenario) => scenario.id === view.scenarioId);
  const showMultiEnvBanner = uniqueEnvKeys.length > 1 && !view.envKey;

  // Auto-select first visible scenario when filters change.
  useEffect(() => {
    if (!payload || visibleScenarios.length === 0) {
      return;
    }
    const isVisible = visibleScenarios.some((scenario) => scenario.id === view.scenarioId);
    if (!isVisible) {
      patchView({ scenarioId: visibleScenarios[0]?.id ?? "" });
    }
  }, [payload, visibleScenarios, view.scenarioId, patchView]);

  const metricsData = useMemo<MetricsResult | null>(() => {
    if (!currentScenario || runIndices.length === 0) {
      return null;
    }
    return buildMetrics({
      scenario: currentScenario,
      runIndices,
      orderedLibraries,
      paletteMap,
      primaryLib,
      compareLibs,
      baseRunIndices,
      envKey: view.envKey,
      runWindow: view.runWindow,
    });
  }, [
    currentScenario,
    runIndices,
    orderedLibraries,
    paletteMap,
    primaryLib,
    compareLibs,
    baseRunIndices,
    view.envKey,
    view.runWindow,
  ]);

  const snapshotRows = useMemo<Array<SnapshotRow>>(() => {
    if (!payload || payload.runs.length === 0) {
      return [];
    }
    const lastIx = payload.runs.length - 1;
    return payload.scenarios.map((scenario) =>
      buildSnapshotRow(scenario, lastIx, orderedLibraries, paletteMap, primaryLib, compareLibs),
    );
  }, [payload, orderedLibraries, paletteMap, primaryLib, compareLibs]);

  const latestRun = payload?.runs[payload.runs.length - 1];

  return {
    orderedLibraries,
    paletteMap,
    visibleScenarios,
    baseRunIndices,
    runIndices,
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
