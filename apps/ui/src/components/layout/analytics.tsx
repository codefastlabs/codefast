import {
  attachClientLifecycle,
  attachRouterPageTracking,
  createClientTracker,
  createLocalStorageQueueStorage,
} from "@codefast/tracking/client";
import { createVercelAnalyticsDestination } from "@codefast/tracking/destinations";
import { useRouter } from "@tanstack/react-router";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { useEffect } from "react";

import { catalog, getOrCreateAnonymousId } from "#/lib/tracking";

/**
 * Mounted once in the root document. Wires `@codefast/tracking`'s client tracker —
 * page views via the router hook, Vercel Analytics as the first destination — and
 * renders Vercel's own script/pageview component.
 */
export function Analytics() {
  const router = useRouter();

  useEffect(() => {
    const tracker = createClientTracker({
      anonymousId: getOrCreateAnonymousId(),
      catalog,
      destinations: [createVercelAnalyticsDestination()],
      storage: createLocalStorageQueueStorage("codefast-ui-tracking-queue"),
    });

    const detachRouter = attachRouterPageTracking(tracker, router);
    const detachLifecycle = attachClientLifecycle(tracker);

    return () => {
      detachRouter();
      detachLifecycle();
    };
  }, [router]);

  return <VercelAnalytics />;
}
