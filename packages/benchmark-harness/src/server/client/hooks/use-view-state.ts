import { useCallback, useState } from "react";
import type { ViewState } from "#/server/client/lib/hash";
import type { EmbeddedViewerPayload } from "#/server/server-types";

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
