import { useCallback, useState } from "react";

import type { ViewState } from "#/app/lib/hash";
import { pickDefaultScenarioId } from "#/app/lib/metrics";
import type { EmbeddedViewerPayload } from "#/types";

/**
 * Holds the chart view state and returns it with a callback for partial patches.
 *
 * @since 0.3.16-canary.1
 */
export function useViewState(initialPayload: EmbeddedViewerPayload | undefined) {
  const [view, setView] = useState<ViewState>(() => ({
    scenarioId: initialPayload ? pickDefaultScenarioId(initialPayload.scenarios) : "",
    envKey: "",
    group: "",
    search: "",
    runWindow: "all",
    showBands: true,
    useLogScale: false,
    showRatio: false,
  }));

  const patchView = useCallback((patch: Partial<ViewState>) => {
    setView((currentView) => ({ ...currentView, ...patch }));
  }, []);

  return { view, patchView };
}
