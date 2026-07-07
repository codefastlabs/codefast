import { createLocalStorageConsentStorage, hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
import { updateGoogleConsent } from "@codefast/tracking/destinations";
import { ConsentBanner, ConsentToggle, useConsent } from "@codefast/tracking/react";
import { useEffect, useSyncExternalStore } from "react";

import {
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  REQUESTED_CONSENT_CATEGORIES,
  resolveInitialConsent,
} from "#/lib/consent";
import { getTracker } from "#/lib/tracking";

const consentStorage = createLocalStorageConsentStorage(CONSENT_STORAGE_KEY);

const emptySubscribe = (): (() => void) => () => {};

/**
 * This app prerenders every route (see `vite.config.ts`), so the static HTML never sees a
 * real visitor — the per-visitor `mode` from `middleware.ts`'s cookie can differ from what
 * the build baked in. Hydrating the region-dependent UI against that markup would
 * mismatch, so it renders nothing until after hydration.
 */
function useHasHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Region-aware consent UI: a blocking opt-in banner for EU/VN, an always-visible
 * opt-out toggle for US/other (CCPA/CPRA requires the persistent control, not just a
 * one-time prompt). `mode` comes from `resolveInitialConsent()` so it matches the
 * server-resolved default `<GoogleTag />` already applied — never a second, possibly
 * different guess.
 */
export function ConsentGate() {
  const { mode } = resolveInitialConsent();

  const consent = useConsent({
    categories: REQUESTED_CONSENT_CATEGORIES,
    hasGlobalPrivacyControlSignal: hasGlobalPrivacyControlSignal(),
    mode,
    onDecision(decision) {
      if (!decision.analytics) {
        getTracker().clear();
      }
    },
    policyVersion: CONSENT_POLICY_VERSION,
    storage: consentStorage,
  });

  // Owns the gtag "consent update" signal — an effect (not onDecision) so decisions made
  // in another tab sync too. No stored decision → no update: `<GoogleTag />`'s inline
  // default already applies, and hydration's first render (server snapshot = undecided)
  // would otherwise emit a transient wrong update.
  useEffect(() => {
    if (consent.decision !== undefined) {
      updateGoogleConsent(consent.decision);
    }
  }, [consent.decision]);

  const hasHydrated = useHasHydrated();

  if (!hasHydrated) {
    return null;
  }

  if (mode === "opt-in") {
    return (
      <ConsentBanner
        consent={consent}
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-lg border border-ui-border bg-ui-surface p-4 text-sm text-ui-fg shadow-lg **:data-[slot=consent-action]:rounded-md **:data-[slot=consent-action]:border **:data-[slot=consent-action]:border-ui-border **:data-[slot=consent-action]:px-3 **:data-[slot=consent-action]:py-1.5 **:data-[slot=consent-action]:transition-colors **:data-[slot=consent-action]:hover:bg-ui-fg/6 **:data-[slot=consent-actions]:mt-3 **:data-[slot=consent-actions]:flex **:data-[slot=consent-actions]:gap-2 sm:inset-x-auto sm:end-4"
      />
    );
  }

  return (
    <ConsentToggle
      consent={consent}
      className="fixed start-4 bottom-4 z-50 rounded-full border border-ui-border bg-ui-surface px-3 py-1.5 text-xs text-ui-muted shadow-sm hover:text-ui-fg"
    />
  );
}
