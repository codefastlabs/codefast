import { createLocalStorageConsentStorage, hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
import { updateGoogleConsent } from "@codefast/tracking/destinations";
import { ConsentBanner, ConsentToggle, useConsent } from "@codefast/tracking/react";
import { useEffect, useState } from "react";

import { CONSENT_POLICY_VERSION, resolveInitialConsent } from "#/lib/consent";
import { getTracker } from "#/lib/tracking";

const consentStorage = createLocalStorageConsentStorage("codefast-ui-consent");

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
    hasGlobalPrivacyControlSignal: hasGlobalPrivacyControlSignal(),
    mode,
    onDecision(decision) {
      if (decision === "denied") {
        getTracker().clear();
      }

      updateGoogleConsent(decision === "granted");
    },
    policyVersion: CONSENT_POLICY_VERSION,
    storage: consentStorage,
  });

  // This app prerenders every route (see `vite.config.ts`), so the static HTML never sees a
  // real visitor — `mode` here can differ from what the build baked in once the per-visitor
  // `middleware.ts` cookie resolves on the client. Rendering before mount would hydrate
  // against markup the server could never have produced for this visitor.
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  if (mode === "opt-in") {
    return (
      <ConsentBanner
        consent={consent}
        className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-lg border border-ui-border bg-ui-surface p-4 text-sm text-ui-fg shadow-lg sm:inset-x-auto sm:right-4 [&_button]:mt-3 [&_button]:mr-2 [&_button]:rounded-md [&_button]:border [&_button]:border-ui-border [&_button]:px-3 [&_button]:py-1.5 [&_button]:text-sm [&_button]:transition-colors [&_button]:hover:bg-ui-fg/6"
      />
    );
  }

  return (
    <ConsentToggle
      consent={consent}
      className="fixed bottom-4 left-4 z-50 rounded-full border border-ui-border bg-ui-surface px-3 py-1.5 text-xs text-ui-muted shadow-sm hover:text-ui-fg"
    />
  );
}
