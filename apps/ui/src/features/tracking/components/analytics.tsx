import { attachClientLifecycle, attachRouterPageTracking } from "@codefast/tracking/client";
import { useRouter } from "@tanstack/react-router";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { useEffect } from "react";

import { getTracker } from "#/features/tracking/lib/tracking";

/**
 * Mounted once in the root document. Wires the shared tracker (`getTracker()`, also
 * used by `CopyButton`/`CommandPalette`) to page views via the router hook and the
 * periodic/unload flush, and renders Vercel's own script/pageview component.
 */
export function Analytics() {
  const router = useRouter();

  useEffect(() => {
    const tracker = getTracker();
    const detachRouter = attachRouterPageTracking(tracker, router);
    const detachLifecycle = attachClientLifecycle(tracker);

    return () => {
      detachRouter();
      detachLifecycle();
    };
  }, [router]);

  return <VercelAnalytics />;
}
