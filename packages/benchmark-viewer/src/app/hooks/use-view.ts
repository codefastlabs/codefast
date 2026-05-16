import { useCallback, useState } from "react";
import type { ViewState } from "#/app/lib/hash";
import type { EmbeddedViewerPayload } from "#/types";

/**
 * @since 0.3.16-canary.1
 */
export function useViewState(initialPayload: EmbeddedViewerPayload | undefined) {
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

  const patchView = useCallback((patch: Partial<ViewState>) => {
    setView((v) => ({ ...v, ...patch }));
  }, []);

  return { view, patchView };
}
