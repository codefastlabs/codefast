import type { EmbeddedViewerPayload } from "#/types";

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

  const envParam = params.get(HASH_KEYS.environment);
  if (envParam !== null) {
    const validEnvKeys = new Set(payload.runs.map((run) => run.envKey));
    if (envParam === "" || validEnvKeys.has(envParam)) {
      patch.envKey = envParam;
    }
  }

  const groupParam = params.get(HASH_KEYS.group);
  const validGroups = new Set(payload.scenarios.map((scenario) => scenario.group));
  if (groupParam && validGroups.has(groupParam)) {
    patch.group = groupParam;
  }

  const searchParam = params.get(HASH_KEYS.search);
  if (searchParam !== null) {
    patch.search = searchParam;
  }

  const runWindowParam = params.get(HASH_KEYS.runWindow);
  if (runWindowParam === "all" || runWindowParam === "10" || runWindowParam === "20") {
    patch.runWindow = runWindowParam;
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

  const scenarioParam = params.get(HASH_KEYS.scenario);
  if (scenarioParam && payload.scenarios.some((scenario) => scenario.id === scenarioParam)) {
    patch.scenarioId = scenarioParam;
  }

  return patch;
}
