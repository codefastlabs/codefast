import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * How long a navigation must stay pending before the bar appears. Most navigations
 * resolve instantly thanks to `defaultPreload: "intent"`, so this delay keeps the
 * bar from flashing on those — it only shows when a loader actually makes the user wait.
 */
const SHOW_DELAY_MS = 150;

/**
 * Slim indeterminate progress bar pinned to the top of the viewport during route
 * transitions. Unlike a `defaultPendingComponent`, it overlays rather than replacing
 * the current page, so the visitor keeps their context while the next route loads.
 */
export function RouteProgress() {
  const isPending = useRouterState({ select: (state) => state.status === "pending" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isPending) {
      setVisible(false);

      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isPending]);

  if (!visible) {
    return null;
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden">
      <div className="h-full w-1/4 animate-route-progress bg-ui-brand" />
    </div>
  );
}
