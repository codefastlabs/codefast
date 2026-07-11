"use client";

import { useEffect, useSyncExternalStore } from "react";

import type { InitialConsentSnapshot, InitialConsentStore } from "#/client/initial-consent-store";

/**
 * Reactive view of a `createInitialConsentStore` — kicks off resolution on mount (a no-op
 * when the app already did so at router creation) and re-renders once the server lane
 * answers. SSR and the first client render read the strictest snapshot, so hydration can
 * never mismatch on region.
 *
 * @since 1.0.0-canary.6
 */
export function useInitialConsent(store: InitialConsentStore): InitialConsentSnapshot {
  // Post-hydration safety net — idempotent with an earlier, pre-hydration kick.
  useEffect(() => {
    store.ensureResolved();
  }, [store]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
