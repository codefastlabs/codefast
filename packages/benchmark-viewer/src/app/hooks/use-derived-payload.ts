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

export interface DerivedPayload {
  orderedLibraries: Array<EmbeddedLibraryMeta>;
  paletteMap: Record<string, PaletteEntry>;
  visibleScenarios: Array<EmbeddedScenarioSeries>;
  baseRunIndices: Array<number>;
  runIndices: Array<number>;
  currentScenario: EmbeddedScenarioSeries | null;
  uniqueEnvKeys: Array<string>;
  uniqueGroups: Array<string>;
  primaryLib: EmbeddedLibraryMeta | undefined;
  compareLibs: Array<EmbeddedLibraryMeta>;
  scenarioIndex: number;
  showMultiEnvBanner: boolean;
  metricsData: MetricsResult | null;
  snapshotRows: Array<SnapshotRow>;
  latestRun: EmbeddedRun | undefined;
}

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
    const primary = payload.libraries.find((l) => l.isPrimary) ?? payload.libraries[0];
    const compares = payload.libraries.filter((l) => !l.isPrimary);
    const ordered: Array<EmbeddedLibraryMeta> = primary
      ? [primary, ...compares]
      : [...payload.libraries];
    const map: Record<string, PaletteEntry> = {};
    ordered.forEach((lib, i) => {
      map[lib.key] = PALETTE[i % PALETTE.length]!;
    });
    return { orderedLibraries: ordered, paletteMap: map };
  }, [payload]);

  const visibleScenarios = useMemo<Array<EmbeddedScenarioSeries>>(() => {
    if (!payload) {
      return [];
    }
    const q = searchNorm(view.search).trim();
    return payload.scenarios.filter((s) => {
      if (view.group && s.group !== view.group) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        searchNorm(s.id).includes(q) ||
        searchNorm(s.group).includes(q) ||
        searchNorm(s.what).includes(q)
      );
    });
  }, [payload, view.group, view.search]);

  const baseRunIndices = useMemo<Array<number>>(() => {
    if (!payload) {
      return [];
    }
    if (!view.envKey) {
      return payload.runs.map((_, i) => i);
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
    const n = parseInt(view.runWindow, 10);
    if (!Number.isFinite(n) || n < 1) {
      return baseRunIndices;
    }
    return baseRunIndices.length <= n
      ? baseRunIndices
      : baseRunIndices.slice(baseRunIndices.length - n);
  }, [baseRunIndices, view.runWindow]);

  const currentScenario = useMemo<EmbeddedScenarioSeries | null>(() => {
    if (!payload) {
      return null;
    }
    return payload.scenarios.find((s) => s.id === view.scenarioId) ?? null;
  }, [payload, view.scenarioId]);

  const uniqueEnvKeys = useMemo<Array<string>>(() => {
    if (!payload) {
      return [];
    }
    return [...new Set(payload.runs.map((r) => r.envKey))].sort((a, b) => a.localeCompare(b));
  }, [payload]);

  const uniqueGroups = useMemo<Array<string>>(() => {
    if (!payload) {
      return [];
    }
    return [...new Set(payload.scenarios.map((s) => s.group))].sort((a, b) => a.localeCompare(b));
  }, [payload]);

  const primaryLib = useMemo(
    () => orderedLibraries.find((l) => l.isPrimary) ?? orderedLibraries[0],
    [orderedLibraries],
  );

  const compareLibs = useMemo(
    () => orderedLibraries.filter((l) => !l.isPrimary),
    [orderedLibraries],
  );

  const scenarioIndex = visibleScenarios.findIndex((s) => s.id === view.scenarioId);
  const showMultiEnvBanner = uniqueEnvKeys.length > 1 && !view.envKey;

  // Auto-select first visible scenario when filters change.
  useEffect(() => {
    if (!payload || visibleScenarios.length === 0) {
      return;
    }
    const isVisible = visibleScenarios.some((s) => s.id === view.scenarioId);
    if (!isVisible) {
      patchView({ scenarioId: visibleScenarios[0]?.id ?? "" });
    }
  }, [payload, visibleScenarios, view.scenarioId, patchView]);

  const metricsData = useMemo<MetricsResult | null>(() => {
    if (!currentScenario || runIndices.length === 0) {
      return null;
    }
    return buildMetrics(
      currentScenario,
      runIndices,
      orderedLibraries,
      paletteMap,
      primaryLib,
      compareLibs,
      baseRunIndices,
      view.envKey,
      view.runWindow,
    );
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
    return payload.scenarios.map((s) =>
      buildSnapshotRow(s, lastIx, orderedLibraries, paletteMap, primaryLib, compareLibs),
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
