import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "#/server/client/components/chart-panel";
import { ChartPanel } from "#/server/client/components/chart-panel";
import { DISPERSION_IQR_ALERT, PALETTE, type PaletteEntry } from "#/server/client/lib/colors";
import {
  formatLocal,
  fmtHz,
  fmtPctChange,
  isMacLikePlatform,
  searchNorm,
} from "#/server/client/lib/format";
import { medianNumeric, ratioFrom } from "#/server/client/lib/metrics";
import type {
  EmbeddedLibraryMeta,
  EmbeddedRun,
  EmbeddedScenarioSeries,
  EmbeddedViewerPayload,
} from "#/server/server-types";

// ─── View state ───────────────────────────────────────────────────────────────

interface ViewState {
  scenarioId: string;
  envKey: string;
  group: string;
  search: string;
  runWindow: "all" | "10" | "20";
  showBands: boolean;
  useLogScale: boolean;
  showRatio: boolean;
}

const HASH_KEYS = {
  environment: "environment",
  group: "group",
  search: "search",
  scenario: "scenario",
  runWindow: "run-window",
  showBands: "show-bands",
  useLogScale: "use-log-scale",
  showRatio: "show-ratio",
};

function buildHash(view: ViewState): string {
  const parts: Array<string> = [];
  if (view.envKey) {
    parts.push(`${HASH_KEYS.environment}=${encodeURIComponent(view.envKey)}`);
  }
  if (view.group) {
    parts.push(`${HASH_KEYS.group}=${encodeURIComponent(view.group)}`);
  }
  if (view.search.trim()) {
    parts.push(`${HASH_KEYS.search}=${encodeURIComponent(view.search.trim())}`);
  }
  if (view.scenarioId) {
    parts.push(`${HASH_KEYS.scenario}=${encodeURIComponent(view.scenarioId)}`);
  }
  if (view.runWindow !== "all") {
    parts.push(`${HASH_KEYS.runWindow}=${encodeURIComponent(view.runWindow)}`);
  }
  parts.push(`${HASH_KEYS.showBands}=${view.showBands ? "1" : "0"}`);
  parts.push(`${HASH_KEYS.useLogScale}=${view.useLogScale ? "1" : "0"}`);
  parts.push(`${HASH_KEYS.showRatio}=${view.showRatio ? "1" : "0"}`);
  return parts.join("&");
}

function parseHash(raw: string, payload: EmbeddedViewerPayload): Partial<ViewState> {
  if (!raw || raw.length < 2) {
    return {};
  }
  const params = new URLSearchParams(raw.replace(/^#/, ""));
  const patch: Partial<ViewState> = {};

  const ev = params.get(HASH_KEYS.environment);
  if (ev !== null) {
    const validEnvKeys = new Set(payload.runs.map((r) => r.envKey));
    if (ev === "" || validEnvKeys.has(ev)) {
      patch.envKey = ev;
    }
  }

  const g = params.get(HASH_KEYS.group);
  const validGroups = new Set(payload.scenarios.map((s) => s.group));
  if (g && validGroups.has(g)) {
    patch.group = g;
  }

  const q = params.get(HASH_KEYS.search);
  if (q !== null) {
    patch.search = q;
  }

  const w = params.get(HASH_KEYS.runWindow);
  if (w === "all" || w === "10" || w === "20") {
    patch.runWindow = w;
  }

  if (params.has(HASH_KEYS.showBands)) {
    patch.showBands = params.get(HASH_KEYS.showBands) === "1";
  }
  if (params.has(HASH_KEYS.useLogScale)) {
    patch.useLogScale = params.get(HASH_KEYS.useLogScale) === "1";
  }
  if (params.has(HASH_KEYS.showRatio)) {
    patch.showRatio = params.get(HASH_KEYS.showRatio) === "1";
  }

  const sc = params.get(HASH_KEYS.scenario);
  if (sc && payload.scenarios.some((s) => s.id === sc)) {
    patch.scenarioId = sc;
  }

  return patch;
}

// ─── App ─────────────────────────────────────────────────────────────────────

export function App({ initialPayload }: { initialPayload?: EmbeddedViewerPayload }) {
  const [payload, setPayload] = useState<EmbeddedViewerPayload | null>(initialPayload ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const [pageOpenedAt] = useState<Date>(() => new Date());

  const [view, setView] = useState<ViewState>(() => ({
    scenarioId: initialPayload?.scenarios[0]?.id ?? "",
    envKey: "",
    group: "",
    search: "",
    runWindow: "all",
    showBands: true,
    useLogScale: false,
    showRatio: false,
  }));

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hashSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hashApplyingRef = useRef(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const paletteInputRef = useRef<HTMLInputElement>(null);

  const patchView = useCallback((patch: Partial<ViewState>) => {
    setView((v) => ({ ...v, ...patch }));
  }, []);

  function showToast(message: string) {
    setToastMsg(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3500);
  }

  // ─── Derived state ──────────────────────────────────────────────────────────

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

  const showMultiEnvBanner = useMemo(() => {
    return uniqueEnvKeys.length > 1 && !view.envKey;
  }, [uniqueEnvKeys, view.envKey]);

  const primaryLib = orderedLibraries.find((l) => l.isPrimary) ?? orderedLibraries[0];
  const compareLibs = orderedLibraries.filter((l) => !l.isPrimary);

  // ─── Auto-select first visible scenario when filters change ────────────────

  useEffect(() => {
    if (!payload || visibleScenarios.length === 0) {
      return;
    }
    const isVisible = visibleScenarios.some((s) => s.id === view.scenarioId);
    if (!isVisible) {
      patchView({ scenarioId: visibleScenarios[0]?.id ?? "" });
    }
  }, [payload, visibleScenarios, view.scenarioId, patchView]);

  // ─── Apply URL hash on payload load ────────────────────────────────────────

  useEffect(() => {
    if (!payload || typeof window === "undefined") {
      return;
    }
    const raw = window.location.hash;
    if (!raw || raw.length < 2) {
      return;
    }
    hashApplyingRef.current = true;
    try {
      const patch = parseHash(raw, payload);
      if (Object.keys(patch).length > 0) {
        patchView(patch);
      }
    } finally {
      hashApplyingRef.current = false;
    }
  }, [payload, patchView]);

  // ─── Sync URL hash on view change (debounced 120 ms) ──────────────────────

  useEffect(() => {
    if (!payload || typeof window === "undefined" || hashApplyingRef.current) {
      return;
    }
    if (hashSyncTimerRef.current) {
      clearTimeout(hashSyncTimerRef.current);
    }
    hashSyncTimerRef.current = setTimeout(() => {
      const next = buildHash(view);
      const withHash = next ? `#${next}` : "";
      if (window.location.hash === withHash) {
        return;
      }
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search + withHash,
      );
    }, 120);
  }, [view, payload]);

  // ─── details persistence via localStorage ──────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const items = [
      { id: "intro-howto-details", key: "bh-howto-open" },
      { id: "chart-data-details", key: "bh-chartdata-open" },
      { id: "snapshot-details", key: "bh-snapshot-open" },
    ];
    const cleanups: Array<() => void> = [];
    for (const cfg of items) {
      const el = document.getElementById(cfg.id) as HTMLDetailsElement | null;
      if (!el) {
        continue;
      }
      try {
        if (localStorage.getItem(cfg.key) === "1") {
          el.open = true;
        }
      } catch {
        /* ignore */
      }
      const handler = () => {
        try {
          localStorage.setItem(cfg.key, el.open ? "1" : "0");
        } catch {
          /* ignore */
        }
      };
      el.addEventListener("toggle", handler);
      cleanups.push(() => el.removeEventListener("toggle", handler));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [payload]);

  // ─── Command palette keyboard shortcut ─────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((open) => {
          if (!open) {
            setPaletteQuery("");
          }
          return !open;
        });
        return;
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      paletteInputRef.current?.focus();
    }
  }, [commandPaletteOpen]);

  // ─── Data loading ───────────────────────────────────────────────────────────

  async function loadData(isReload = false) {
    if (isReload) {
      setIsReloading(true);
    }
    try {
      const res = await fetch("/api/payload", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as EmbeddedViewerPayload;
      setPayload(data);
      setLoadError(null);
      if (!view.scenarioId && data.scenarios[0]) {
        patchView({ scenarioId: data.scenarios[0].id });
      }
    } catch (err) {
      if (isReload) {
        showToast(`Could not reload data: ${String(err)}`);
      } else {
        setLoadError(String(err));
      }
    } finally {
      if (isReload) {
        setIsReloading(false);
      }
    }
  }

  // ─── PNG export ─────────────────────────────────────────────────────────────

  function handleDownloadPng(chartRef: RefObject<ChartInstance | null>) {
    const chart = chartRef.current;
    if (!chart) {
      showToast("Nothing to export yet — select a scenario with plotted runs.");
      return;
    }
    const sid = String(view.scenarioId || "chart").replace(/[^a-zA-Z0-9_.-]+/g, "_");
    const filename = `bench-history-${sid}.png`;
    const a = document.createElement("a");
    a.download = filename;
    a.href = (
      chart as ChartInstance & { toBase64Image: (type: string, quality: number) => string }
    ).toBase64Image("image/png", 1);
    a.click();
    showToast(`Saved ${filename}`);
  }

  // ─── Copy link ──────────────────────────────────────────────────────────────

  function copyViewLink() {
    const hash = buildHash(view);
    const url = window.location.origin + window.location.pathname + (hash ? `#${hash}` : "");
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(url).then(
        () => showToast("Link copied"),
        () => showToast("Could not copy"),
      );
    } else {
      showToast("Clipboard unavailable");
    }
  }

  // ─── Command palette actions ────────────────────────────────────────────────

  const scenarioIndex = visibleScenarios.findIndex((s) => s.id === view.scenarioId);

  function runPaletteCommand(id: string) {
    setCommandPaletteOpen(false);
    switch (id) {
      case "reload-data":
        void loadData(true);
        break;
      case "focus-search":
        document.getElementById("scenario-search")?.focus();
        break;
      case "scenario-next":
        if (scenarioIndex < visibleScenarios.length - 1) {
          patchView({ scenarioId: visibleScenarios[scenarioIndex + 1]!.id });
        }
        break;
      case "scenario-prev":
        if (scenarioIndex > 0) {
          patchView({ scenarioId: visibleScenarios[scenarioIndex - 1]!.id });
        }
        break;
      case "toggle-bands":
        patchView({ showBands: !view.showBands });
        break;
      case "toggle-log":
        patchView({ useLogScale: !view.useLogScale });
        break;
      case "toggle-ratio":
        patchView({ showRatio: !view.showRatio });
        break;
      case "reset-zoom":
        document.getElementById("chart-reset-zoom-btn")?.click();
        break;
      case "download-png":
        document.getElementById("chart-download-png-btn")?.click();
        break;
      case "copy-link":
        copyViewLink();
        break;
    }
  }

  const paletteActions = [
    { id: "reload-data", label: "Reload bench data from server" },
    { id: "focus-search", label: "Focus scenario search" },
    { id: "scenario-next", label: "Next scenario" },
    { id: "scenario-prev", label: "Previous scenario" },
    { id: "toggle-bands", label: "Toggle P25–P75 band" },
    { id: "toggle-log", label: "Toggle log Y axis" },
    { id: "toggle-ratio", label: "Toggle primary ratios" },
    { id: "reset-zoom", label: "Reset chart zoom" },
    { id: "download-png", label: "Download chart as PNG" },
    { id: "copy-link", label: "Copy link to this view" },
  ];

  const filteredPaletteActions = paletteActions.filter((a) => {
    if (!paletteQuery.trim()) {
      return true;
    }
    return a.label.toLowerCase().includes(paletteQuery.toLowerCase());
  });

  // ─── Metrics ────────────────────────────────────────────────────────────────

  const metricsData = useMemo(() => {
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

  // ─── Snapshot table ─────────────────────────────────────────────────────────

  const snapshotRows = useMemo(() => {
    if (!payload || payload.runs.length === 0) {
      return [];
    }
    const lastIx = payload.runs.length - 1;
    return payload.scenarios.map((s) =>
      buildSnapshotRow(s, lastIx, orderedLibraries, paletteMap, primaryLib, compareLibs),
    );
  }, [payload, orderedLibraries, paletteMap, primaryLib, compareLibs]);

  // ─── No payload (initial load) ─────────────────────────────────────────────

  if (!payload) {
    return (
      <>
        <a className="bh-skip-link" href="#bench-chart-host">
          Skip to chart
        </a>
        <div aria-live="polite" id="loading-overlay" role="status">
          {loadError ? (
            <div className="bh-error">
              <p className="bh-error__title">Failed to load bench data.</p>
              <p className="bh-error__detail">{loadError}</p>
              <p className="bh-error__hint">
                Run <code className="bh-error__code">pnpm bench</code> first to generate data.
              </p>
            </div>
          ) : (
            <div className="bh-loading__stack">
              <div className="bh-spinner bh-spinner--ring" />
              <p className="bh-loading__text">Loading bench data…</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const latestRun: EmbeddedRun | undefined = payload.runs[payload.runs.length - 1];

  return (
    <>
      <a className="bh-skip-link" href="#bench-chart-host">
        Skip to chart
      </a>

      <main className="bh-app-shell" id="app" role="main">
        {/* Header */}
        <header className="bh-page-header">
          <p className="bh-eyebrow">Bench history viewer</p>
          <h1 className="bh-page-title">
            {payload.title}
            <span className="bh-title-suffix"> · hz/op median per run</span>
          </h1>
          <div className="bh-header-lede-row">
            <p className="bh-lede">
              Median hz/op per saved run, optional P25–P75 bands, and primary-vs-compare ratios.{" "}
              <span className="bh-lede__muted">Press</span>{" "}
              <kbd className="bh-kbd">
                {typeof window !== "undefined" && isMacLikePlatform() ? "⌘K" : "⌘K"}
              </kbd>{" "}
              <span className="bh-lede__muted">or</span> <kbd className="bh-kbd">Ctrl+K</kbd>{" "}
              <span className="bh-lede__muted">for quick actions.</span>
            </p>
            <div className="bh-header-actions">
              <button
                aria-label="Copy link to this view"
                className="bh-btn-reload"
                onClick={copyViewLink}
                title="Copies URL including filters, scenario, and display toggles"
                type="button"
              >
                Copy link
              </button>
            </div>
          </div>
          <details className="bh-glass bh-glass--tight bh-howto" id="intro-howto-details">
            <summary className="bh-details-summary bh-details-summary--prominent">
              How to read this viewer
            </summary>
            <div className="bh-howto__prose">
              <p>
                Quantiles mirror <code className="bh-inline-code">report.ts</code> across trials.
                Bands are per‑trial hz/op spread (P25–P75); tooltip IQR% and a dispersion hint
                highlight noisy runs. Axis labels use your{" "}
                <strong className="bh-prose-emphasis">local time</strong>. Toggle{" "}
                <strong className="bh-prose-emphasis">Primary ratios</strong> to overlay primary ÷
                compare on the right axis. Use{" "}
                <strong className="bh-prose-emphasis">Runs shown</strong> to focus on the most
                recent history window.
              </p>
            </div>
          </details>
        </header>

        {/* Multi-env banner */}
        {showMultiEnvBanner && (
          <div className="bh-env-banner" role="status" style={{ display: "block" }}>
            <strong className="bh-env-banner__title">Multiple environments in history.</strong>{" "}
            Prefer an Environment filter before comparing regimes (CPU × Node fingerprints differ
            across machines).
          </div>
        )}

        {/* Scenario finder */}
        <section aria-label="Find scenarios" className="bh-find-panel bh-glass bh-glass--tight">
          <h2 className="bh-section-title">Find scenarios</h2>
          <div className="bh-find-panel__row">
            <label className="bh-label-wrap--search">
              <span className="bh-field-label">Search</span>
              <input
                autoComplete="off"
                className="bh-focus bh-field bh-field--search"
                id="scenario-search"
                onChange={(e) => patchView({ search: e.target.value })}
                placeholder="Filter by scenario, group…"
                type="search"
                value={view.search}
              />
            </label>
            <label className="bh-label-wrap--group">
              <span className="bh-field-label">Group</span>
              <select
                aria-label="Filter by group"
                className="bh-focus bh-field bh-field--group"
                onChange={(e) => patchView({ group: e.target.value })}
                value={view.group}
              >
                <option value="">All groups</option>
                {uniqueGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Chart control panel */}
        <div aria-label="Chart data selection" className="bh-chart-control-panel bh-glass--sticky">
          <div className="bh-chart-control-panel__head">
            <p className="bh-section-title">Chart data</p>
            <button
              aria-busy={isReloading}
              aria-label="Reload benchmark data from server"
              className="bh-btn-reload"
              disabled={isReloading}
              onClick={() => void loadData(true)}
              title="Fetch the latest runs from the server without refreshing the page"
              type="button"
            >
              <svg
                aria-hidden="true"
                className="bh-btn-reload__icon"
                fill="none"
                height="14"
                viewBox="0 0 24 24"
                width="14"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              Reload data
            </button>
          </div>
          <div className="bh-chart-control-panel__fields">
            <div className="bh-chart-control-panel__scenario">
              <label className="bh-label-wrap--scenario">
                <span className="bh-field-label">Scenario</span>
                <select
                  aria-label="Benchmark scenario"
                  className="bh-focus bh-field bh-field--chart-select"
                  onChange={(e) => patchView({ scenarioId: e.target.value })}
                  value={view.scenarioId}
                >
                  {visibleScenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.group}] {s.id}
                    </option>
                  ))}
                </select>
              </label>
              <div
                aria-label="Previous or next scenario in the filtered list"
                className="bh-chart-toolbar bh-chart-toolbar--match-field bh-chart-toolbar--scenario-nav"
                role="group"
              >
                <button
                  aria-label="Previous scenario"
                  className="bh-seg-btn"
                  disabled={scenarioIndex <= 0}
                  onClick={() => {
                    if (scenarioIndex > 0) {
                      patchView({ scenarioId: visibleScenarios[scenarioIndex - 1]!.id });
                    }
                  }}
                  title="Previous scenario in filtered list"
                  type="button"
                >
                  ← Prev
                </button>
                <button
                  aria-label="Next scenario"
                  className="bh-seg-btn"
                  disabled={scenarioIndex >= visibleScenarios.length - 1}
                  onClick={() => {
                    if (scenarioIndex < visibleScenarios.length - 1) {
                      patchView({ scenarioId: visibleScenarios[scenarioIndex + 1]!.id });
                    }
                  }}
                  title="Next scenario in filtered list"
                  type="button"
                >
                  Next →
                </button>
              </div>
            </div>
            <label className="bh-label-wrap--env">
              <span className="bh-field-label">Environment</span>
              <select
                aria-label="Filter runs by CPU and Node"
                className="bh-focus bh-field bh-field--chart-select"
                onChange={(e) => patchView({ envKey: e.target.value })}
                value={view.envKey}
              >
                <option value="">All runs</option>
                {uniqueEnvKeys.map((key) => {
                  const sample = payload.runs.find((r) => r.envKey === key);
                  return (
                    <option key={key} value={key}>
                      {sample?.envLabel ?? key}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="bh-label-wrap--window">
              <span className="bh-field-label">Runs shown</span>
              <select
                aria-label="Limit chart to the most recent runs"
                className="bh-focus bh-field bh-field--chart-select"
                onChange={(e) => patchView({ runWindow: e.target.value as ViewState["runWindow"] })}
                title="After Environment filter, only the newest N runs are plotted"
                value={view.runWindow}
              >
                <option value="all">All matching runs</option>
                <option value="20">Last 20 runs</option>
                <option value="10">Last 10 runs</option>
              </select>
            </label>
          </div>
        </div>

        {/* Chart section */}
        <ChartPanel
          baseRunIndices={baseRunIndices}
          envKey={view.envKey}
          logScaleChange={(v) => patchView({ useLogScale: v })}
          onClearEnv={() => patchView({ envKey: "" })}
          onClearGroup={() => patchView({ group: "" })}
          onClearSearch={() => patchView({ search: "" })}
          onDownloadPng={handleDownloadPng}
          orderedLibraries={orderedLibraries}
          paletteMap={paletteMap}
          runIndices={runIndices}
          runs={payload.runs}
          scenario={currentScenario}
          showBands={view.showBands}
          showBandsChange={(v) => patchView({ showBands: v })}
          showRatio={view.showRatio}
          showRatioChange={(v) => patchView({ showRatio: v })}
          subtitle=""
          useLogScale={view.useLogScale}
        />

        {/* Metrics panel */}
        <section
          aria-live="polite"
          className="bh-metrics-section bh-metrics-section--after-chart bh-glass bh-glass--tight"
          id="summary"
        >
          <div className="bh-metrics-section__head">
            <h2 className="bh-section-title">Selected scenario metrics</h2>
            {currentScenario && runIndices.length > 0 && (
              <span
                className={`bh-chip ${metricsData?.hasHighDispersion ? "bh-chip--warn" : "bh-chip--ok"}`}
              >
                [{currentScenario.group}] {currentScenario.id}
              </span>
            )}
          </div>
          {currentScenario?.what && (
            <p className="bh-metrics-section__what">{currentScenario.what}</p>
          )}
          <div className="bh-metrics-section__cards bh-metrics-grid">
            {metricsData?.cards.map((card, i) => (
              <MetricCard key={i} {...card} />
            ))}
          </div>
          {metricsData?.footnote && (
            <p className="bh-metrics-section__footnote">{metricsData.footnote}</p>
          )}
        </section>

        {/* History KPIs */}
        <div aria-label="History overview" className="bh-kpi-grid">
          <div className="bh-card">
            <div className="bh-lbl">Saved runs</div>
            <div className="bh-val bh-kpi-val--primary">{payload.runs.length}</div>
          </div>
          <div className="bh-card">
            <div className="bh-lbl">Scenarios tracked</div>
            <div className="bh-val bh-kpi-val--primary">{payload.scenarios.length}</div>
          </div>
          <div className="bh-card bh-kpi-card--wide-sm">
            <div className="bh-lbl">Newest saved run · local clock</div>
            <div className="bh-val bh-kpi-val--secondary" suppressHydrationWarning>
              {latestRun
                ? (() => {
                    const clock = formatLocal(latestRun.timestampIso, latestRun.folder);
                    return clock ? `${clock} · folder ${latestRun.folder}` : latestRun.folder;
                  })()
                : "—"}
            </div>
          </div>
          <div className="bh-card bh-kpi-card--standard-xl">
            <div className="bh-lbl">Library builds (latest run)</div>
            <div className="bh-val bh-kpi-val--meta">
              {latestRun?.libraryVersions?.length
                ? latestRun.libraryVersions.map((lv) => (
                    <div className="bh-lib-version__row" key={lv.key}>
                      <span className="bh-lib-version__key">{lv.key}</span> {lv.version}
                      {lv.gcExposed && (
                        <span className="bh-gc-tag" title="--expose-gc active">
                          {" "}
                          [gc]
                        </span>
                      )}
                    </div>
                  ))
                : "—"}
            </div>
          </div>
        </div>

        {/* Snapshot table */}
        <details className="bh-snapshot-details" id="snapshot-details">
          <summary className="bh-details-summary bh-details-summary--dense">
            Snapshot of <span className="bh-snapshot__accent">globally newest</span> bench folder —
            throughput by scenario (table)
          </summary>
          <p className="bh-snapshot__desc" id="snapshot-desc">
            Rows use the chronologically last run directory ({payload.runs.length} total),
            independent of the Environment selector.
          </p>
          <div className="bh-table-wrap">
            <table
              aria-label="Latest run throughput by scenario"
              className="bh-table bh-table--zebra"
            >
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
            <div className="bh-snapshot__meta" suppressHydrationWarning>
              Folder {latestRun.folder} · {formatLocal(latestRun.timestampIso, latestRun.folder)}{" "}
              (local)
            </div>
          )}
        </details>

        {/* Footer */}
        <p className="bh-page-footer" suppressHydrationWarning>
          Reload data from Chart data or refresh the page for the latest snapshot ·{" "}
          {payload.runs.length} runs · {payload.scenarios.length} scenarios.
          {payload.generatedAtIso
            ? ` Data snapshot ${formatLocal(payload.generatedAtIso, payload.generatedAtIso)} (server clock).`
            : ""}
          {` Page opened ${formatLocal(pageOpenedAt.toISOString(), "")} (local).`}
        </p>
      </main>

      {/* Command palette */}
      <div
        aria-hidden={!commandPaletteOpen}
        aria-labelledby="command-palette-title"
        aria-modal="true"
        className={`bh-command-palette ${commandPaletteOpen ? "" : "bh-command-palette--hidden"}`}
        id="command-palette"
        role="dialog"
      >
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- scrim dismisses dialog on click/Escape; Escape is handled by the parent dialog keydown */}
        <div className="bh-command-palette__scrim" onClick={() => setCommandPaletteOpen(false)} />
        <div className="bh-glass bh-command-palette__panel">
          <p className="sr-only" id="command-palette-title">
            Command palette
          </p>
          <input
            aria-autocomplete="list"
            aria-controls="command-palette-list"
            autoComplete="off"
            className="bh-focus bh-field bh-command-palette__input"
            onChange={(e) => setPaletteQuery(e.target.value)}
            placeholder="Search actions…"
            ref={paletteInputRef}
            type="search"
            value={paletteQuery}
          />
          {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- command palette is not a native <select>; listbox/option is the correct ARIA pattern here */}
          <ul className="bh-command-palette__list" id="command-palette-list" role="listbox">
            {filteredPaletteActions.map((a) => (
              <li key={a.id} role="none">
                <button
                  aria-selected={false}
                  className="bh-focus bh-command-palette__item"
                  onClick={() => runPaletteCommand(a.id)}
                  role="option"
                  type="button"
                >
                  {a.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="bh-command-palette__hint" suppressHydrationWarning>
            {typeof window !== "undefined" && isMacLikePlatform() ? (
              <>
                Esc closes · <kbd className="bh-kbd">⌘K</kbd> toggles
              </>
            ) : (
              <>
                Esc closes · <kbd className="bh-kbd">Ctrl+K</kbd> toggles
              </>
            )}
          </p>
        </div>
      </div>

      {/* Toast */}
      <div
        aria-atomic="true"
        aria-live="polite"
        className={`pointer-events-none fixed right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-[200] max-w-[min(20rem,calc(100vw-2rem))] rounded-[0.875rem] border border-[rgba(10,132,255,0.35)] bg-[rgba(34,36,42,0.88)] px-[1.05rem] py-[0.7rem] text-[0.8125rem] font-medium text-[rgb(240,244,255)] shadow-[0_0.0625rem_0_rgba(255,255,255,0.06)_inset,0_1rem_3rem_rgba(0,0,0,0.45)] backdrop-blur-[1.25rem] backdrop-saturate-180 [transition:opacity_0.22s_ease,transform_0.22s_cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${toastMsg ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"}`}
        id="bh-toast"
        role="status"
      >
        {toastMsg}
      </div>
    </>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  meta: Array<string>;
  accentColor?: string;
  isRatio?: boolean;
}

function MetricCard({ label, value, meta, accentColor, isRatio }: MetricCardProps) {
  return (
    <div
      aria-label={label}
      className={`bh-card${isRatio ? " bh-metric--accent-ratio" : ""}`}
      role="group"
      style={
        accentColor
          ? ({ "--color-bh-metric-accent": accentColor } as React.CSSProperties)
          : undefined
      }
    >
      <div className="bh-lbl bh-tint-lbl">{label}</div>
      <div className="bh-val bh-tint-val">{value}</div>
      {meta.map((m, i) => (
        <div className="bh-metric__meta" dangerouslySetInnerHTML={{ __html: m }} key={i} />
      ))}
    </div>
  );
}

// ─── Metrics computation ──────────────────────────────────────────────────────

interface MetricsResult {
  cards: Array<MetricCardProps>;
  hasHighDispersion: boolean;
  footnote: string;
}

function buildMetrics(
  scenario: EmbeddedScenarioSeries,
  runIndices: Array<number>,
  orderedLibraries: Array<EmbeddedLibraryMeta>,
  paletteMap: Record<string, PaletteEntry>,
  primaryLib: EmbeddedLibraryMeta | undefined,
  compareLibs: Array<EmbeddedLibraryMeta>,
  baseRunIndices: Array<number>,
  envKey: string,
  runWindow: string,
): MetricsResult {
  const cards: Array<MetricCardProps> = [];
  let worstIqr = 0;

  for (const lib of orderedLibraries) {
    const libData = scenario.libraries[lib.key];
    if (!libData) {
      continue;
    }
    const color = paletteMap[lib.key]?.text;
    const hzValues = runIndices
      .map((gx) => libData.hz[gx])
      .filter((v): v is number => typeof v === "number" && v > 0);

    const median = medianNumeric(hzValues);
    const lo = hzValues.length ? Math.min(...hzValues) : null;
    const hi = hzValues.length ? Math.max(...hzValues) : null;

    const hzAtOldest = runIndices[0] !== undefined ? (libData.hz[runIndices[0]] ?? null) : null;
    const hzAtNewest =
      runIndices[runIndices.length - 1] !== undefined
        ? (libData.hz[runIndices[runIndices.length - 1]!] ?? null)
        : null;

    let trend = "—";
    if (
      runIndices.length >= 2 &&
      typeof hzAtOldest === "number" &&
      hzAtOldest > 0 &&
      typeof hzAtNewest === "number" &&
      hzAtNewest > 0
    ) {
      trend = fmtPctChange(hzAtOldest, hzAtNewest) + ", oldest → newest run in filter";
    }

    const runsWithData = hzValues.length;
    const runsPlotted = runIndices.length;

    for (const gx of runIndices) {
      const f = libData.iqrFraction[gx];
      if (typeof f === "number" && Number.isFinite(f)) {
        worstIqr = Math.max(worstIqr, f);
      }
    }

    const meta: Array<string> = [];
    if (lo !== null && hi !== null) {
      meta.push(`<span class="bh-metric__meta--mono">Range ${fmtHz(lo)} … ${fmtHz(hi)}</span>`);
    }
    meta.push(`Δ ${trend}`);
    if (runsWithData < runsPlotted) {
      meta.push(
        `<span class="bh-metric__meta--fine">${runsWithData} of ${runsPlotted} plotted runs have median hz/op</span>`,
      );
    }

    cards.push({
      label: `${lib.displayName} median hz/op`,
      value: median !== null ? `${fmtHz(median)} Hz/op` : "—",
      meta,
      accentColor: color,
    });
  }

  // Ratio cards
  if (primaryLib) {
    for (const cmpLib of compareLibs) {
      const primData = scenario.libraries[primaryLib.key];
      const cmpData = scenario.libraries[cmpLib.key];
      if (!primData || !cmpData) {
        continue;
      }

      const primHzVals = runIndices
        .map((gx) => primData.hz[gx])
        .filter((v): v is number => typeof v === "number" && v > 0);
      const cmpHzVals = runIndices
        .map((gx) => cmpData.hz[gx])
        .filter((v): v is number => typeof v === "number" && v > 0);
      const primMed = medianNumeric(primHzVals);
      const cmpMed = medianNumeric(cmpHzVals);
      const ratioMedians = ratioFrom(primMed, cmpMed);
      const runRatios = runIndices
        .map((gx) => ratioFrom(primData.hz[gx], cmpData.hz[gx]))
        .filter((v): v is number => v !== null);
      const medianOfRunRatios = medianNumeric(runRatios);
      const showPaired =
        medianOfRunRatios !== null &&
        ratioMedians !== null &&
        Math.abs(medianOfRunRatios - ratioMedians) / ratioMedians > 0.002;

      const meta = [
        "Median ÷ median for this filter; each side uses runs with hz/op for that library.",
      ];
      if (showPaired) {
        meta.push(
          `Median of per-run ratios · <span class="bh-metric__fig">${medianOfRunRatios!.toFixed(3)}×</span>`,
        );
      }

      cards.push({
        label: `Ratio · ${primaryLib.displayName} ÷ ${cmpLib.displayName}`,
        value: ratioMedians !== null ? `${ratioMedians.toFixed(3)}×` : "—",
        meta,
        isRatio: true,
      });
    }
  }

  // IQR card
  const iqrRows = orderedLibraries.map((lib) => {
    const libData = scenario.libraries[lib.key];
    let fig = "—";
    if (libData) {
      let maxF = 0;
      for (const gx of runIndices) {
        const f = libData.iqrFraction[gx];
        if (typeof f === "number" && Number.isFinite(f)) {
          maxF = Math.max(maxF, f);
        }
      }
      if (maxF > 0) {
        fig = `${(maxF * 100).toFixed(1)}%`;
      }
    }
    return `<div class="bh-metric-row"><span class="bh-metric-row__name">${lib.displayName}</span><span class="bh-metric-row__fig">${fig}</span></div>`;
  });

  cards.push({
    label: "Worst IQR÷median · per plotted run",
    value: "",
    meta: [`<div class="bh-metric__iqr">${iqrRows.join("")}</div>`],
  });

  const footPieces: Array<string> = [
    `${runIndices.length} run(s) on the chart${envKey ? "; environment filter on" : "; all environments"}. Median & range: all filtered runs with hz/op. Δ: % change from first → last run in this view when both have data`,
  ];
  if (runWindow !== "all" && runIndices.length < baseRunIndices.length) {
    footPieces.push(
      `Runs shown: last ${runIndices.length} of ${baseRunIndices.length} runs matching Environment + search/group filters`,
    );
  }
  if (worstIqr > DISPERSION_IQR_ALERT) {
    footPieces.push(
      `elevated per-trial dispersion (IQR above ${DISPERSION_IQR_ALERT * 100}% of median) on ≥1 plotted run — inspect tooltip IQR%`,
    );
  }

  return {
    cards,
    hasHighDispersion: worstIqr > DISPERSION_IQR_ALERT,
    footnote: footPieces.join(". ") + ".",
  };
}

// ─── Snapshot row ─────────────────────────────────────────────────────────────

interface SnapshotRow {
  id: string;
  group: string;
  hzCells: Array<string>;
  ratioCells: Array<string>;
}

function buildSnapshotRow(
  s: EmbeddedScenarioSeries,
  lastIx: number,
  orderedLibraries: Array<EmbeddedLibraryMeta>,
  paletteMap: Record<string, PaletteEntry>,
  primaryLib: EmbeddedLibraryMeta | undefined,
  compareLibs: Array<EmbeddedLibraryMeta>,
): SnapshotRow {
  const libHzMap: Record<string, number | null> = {};
  const hzCells: Array<string> = [];
  for (const lib of orderedLibraries) {
    const hz = s.libraries[lib.key]?.hz[lastIx] ?? null;
    const val = typeof hz === "number" && hz > 0 ? hz : null;
    libHzMap[lib.key] = val;
    hzCells.push(val !== null ? fmtHz(val) : "—");
  }

  const primaryHz = primaryLib ? (libHzMap[primaryLib.key] ?? null) : null;
  const ratioCells: Array<string> = compareLibs.map((cmp) => {
    const ratio = ratioFrom(primaryHz, libHzMap[cmp.key] ?? null);
    return ratio !== null ? `${ratio.toFixed(3)}×` : "—";
  });

  return { id: s.id, group: s.group, hzCells, ratioCells };
}
