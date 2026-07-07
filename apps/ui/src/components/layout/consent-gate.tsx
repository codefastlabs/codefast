import { createLocalStorageConsentStorage, hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
import { updateGoogleConsent } from "@codefast/tracking/destinations";
import { ConsentToggle, useConsent } from "@codefast/tracking/react";
import { Button } from "@codefast/ui/button";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ConsentBannerCard } from "#/components/layout/consent-banner-card";
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
 * one-time prompt). Opt-in regions keep a persistent "Cookie settings" control after a
 * decision — GDPR expects withdrawing consent to be as easy as giving it. `mode` comes
 * from `resolveInitialConsent()` so it matches the server-resolved default
 * `<GoogleTag />` already applied — never a second, possibly different guess.
 */
export function ConsentGate() {
  const { mode } = resolveInitialConsent();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    if (consent.needsPrompt || isSettingsOpen) {
      return (
        <ConsentBannerCard
          consent={consent}
          onDecision={() => {
            setIsSettingsOpen(false);
          }}
        />
      );
    }

    return (
      <Button
        className="fixed start-4 bottom-4 z-50 rounded-full text-xs text-ui-muted shadow-sm hover:text-ui-fg"
        size="xs"
        variant="outline"
        onClick={() => {
          setIsSettingsOpen(true);
        }}
      >
        Cookie settings
      </Button>
    );
  }

  return (
    <ConsentToggle
      consent={consent}
      className="fixed start-4 bottom-4 z-50 rounded-full border border-ui-border bg-ui-card px-3 py-1.5 text-xs text-ui-muted shadow-sm transition-colors hover:text-ui-fg"
    />
  );
}
