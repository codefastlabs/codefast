import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { useEffect } from "react";

import { refreshAnonymousId } from "#/features/tracking/lib/tracking";
import { consentRuntime } from "#/features/tracking/lib/visitor-consent";

/**
 * Mounted once in the root document. Renders Vercel's own script/pageview component and
 * owns the anonymous-id refresh: page views need no tracker lane here — the gtag
 * bootstrap's `config` plus GA4 Enhanced Measurement cover initial and SPA navigations,
 * and `<VercelAnalytics />` tracks its own — so the id's ITP re-issue happens explicitly
 * (once consent resolves as allowed, or on a later grant) instead of hiding inside a
 * page-view side effect. `refreshAnonymousId` never mints: new visitors get an id at
 * their first tracked interaction.
 */
export function Analytics() {
  useEffect(() => {
    // Internal gates (consent, existing cookie, once-per-load server re-issue) make this
    // safe to call on every signal — resolve, banner grant, cross-tab decision.
    refreshAnonymousId();

    const unsubscribeStore = consentRuntime.initialConsentStore.subscribe(refreshAnonymousId);
    const unsubscribeStorage = consentRuntime.storage.subscribe(refreshAnonymousId);

    return () => {
      unsubscribeStore();
      unsubscribeStorage();
    };
  }, []);

  return <VercelAnalytics />;
}
