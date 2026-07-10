import { updateGoogleConsent } from "@codefast/tracking/destinations";
import { ConsentToggle, useGoogleConsentSync } from "@codefast/tracking/react";
import { CookieIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { ConsentBannerCard } from "#/features/tracking/components/consent-banner-card";
import { PrivacyChoicesIcon } from "#/features/tracking/components/privacy-choices-icon";
import { loadGoogleTagScript } from "#/features/tracking/lib/google-tag-loader";
import { useSiteConsent } from "#/features/tracking/lib/site-consent";
import { useHasHydrated } from "#/hooks/use-has-hydrated";

/**
 * Region-aware consent UI, rendered inside the footer: an opt-in banner plus a "Cookie
 * settings" reopen link for EU/VN (GDPR expects withdrawing consent to be as easy as
 * giving it), and a persistent analytics opt-out toggle with the privacy-options icon
 * for US/other — this site sells or shares no personal data, so the control is named by
 * what it actually does instead of CCPA's "Do Not Sell" wording. `mode` arrives per
 * visitor over the server-function lane (`useSiteConsent`), so nothing renders until it
 * resolves — an EU banner must never flash at a US visitor or vice versa.
 */
export function ConsentGate() {
  const { consent, isResolved, mode } = useSiteConsent();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Owns the gtag "consent update" signal — an effect (not onDecision) so decisions made
  // in another tab or on the privacy page sync too. No stored decision → no update:
  // `<GoogleTag />`'s inline default already applies, and hydration's first render
  // (server snapshot = undecided) would otherwise emit a transient wrong update.
  useGoogleConsentSync(consent, { loadGtagScript: loadGoogleTagScript });

  // The bootstrap bakes the strictest default; an undecided opt-out visitor's granted
  // regional default only exists client-side, so gtag must be told once the region resolves.
  useEffect(() => {
    if (isResolved && mode === "opt-out" && consent.decision === undefined) {
      updateGoogleConsent(consent.effectiveConsent);
    }
  }, [isResolved, mode, consent.decision, consent.effectiveConsent]);

  const hasHydrated = useHasHydrated();

  if (!hasHydrated || !isResolved) {
    return null;
  }

  if (mode === "opt-in") {
    return (
      <>
        {consent.isPromptNeeded || isSettingsOpen ? (
          <ConsentBannerCard
            consent={consent}
            // this branch already decided the banner shows — without `open`, the root would
            // re-gate on isPromptNeeded and refuse to reopen after a stored decision
            open
            onDecision={() => {
              setIsSettingsOpen(false);
            }}
          />
        ) : null}
        <button
          className="inline-flex cursor-pointer items-center gap-1.5 text-ui-muted transition-colors hover:text-ui-fg"
          type="button"
          onClick={() => {
            setIsSettingsOpen(true);
          }}
        >
          <CookieIcon aria-hidden className="size-3.5" />
          Cookie settings
        </button>
      </>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <PrivacyChoicesIcon aria-hidden className="h-3.5 w-auto" />
      <ConsentToggle
        allowLabel="Turn on analytics"
        consent={consent}
        denyLabel="Turn off analytics"
        toggledCategories={["analytics"]}
        className="cursor-pointer text-ui-muted transition-colors hover:text-ui-fg"
      />
    </span>
  );
}
