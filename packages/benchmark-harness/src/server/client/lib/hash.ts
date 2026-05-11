import type { EmbeddedViewerPayload } from "#/server/server-types";

/**
 * @since 0.3.16-canary.1
 */
export interface ViewState {
  scenarioId: string;
  envKey: string;
  group: string;
  search: string;
  runWindow: "all" | "10" | "20";
  showBands: boolean;
  useLogScale: boolean;
  showRatio: boolean;
}

/**
 * @since 0.3.16-canary.1
 */
export const HASH_KEYS = {
  environment: "environment",
  group: "group",
  search: "search",
  scenario: "scenario",
  runWindow: "run-window",
  showBands: "show-bands",
  useLogScale: "use-log-scale",
  showRatio: "show-ratio",
};

/**
 * @since 0.3.16-canary.1
 */
export function buildHash(view: ViewState): string {
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

/**
 * @since 0.3.16-canary.1
 */
export function parseHash(raw: string, payload: EmbeddedViewerPayload): Partial<ViewState> {
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
