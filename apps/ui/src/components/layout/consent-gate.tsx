import { updateGoogleConsent } from "@codefast/tracking/destinations";
import { ConsentToggle } from "@codefast/tracking/react";
import { CookieIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { ConsentBannerCard } from "#/components/layout/consent-banner-card";
import { PrivacyChoicesIcon } from "#/components/layout/privacy-choices-icon";
import { useSiteConsent } from "#/lib/site-consent";
import { useHasHydrated } from "#/lib/use-has-hydrated";

/**
 * Region-aware consent UI, rendered inside the footer: an opt-in banner plus a "Cookie
 * settings" reopen link for EU/VN (GDPR expects withdrawing consent to be as easy as
 * giving it), and the "Do Not Sell or Share" link with the standard privacy-options icon
 * for US/other — footer placement is the accepted pattern for CCPA's conspicuous-link
 * requirement, without a floating widget nagging visitors who already decided. `mode`
 * comes from `resolveInitialConsent()` so it matches the server-resolved default
 * `<GoogleTag />` already applied — never a second, possibly different guess.
 */
export function ConsentGate() {
  const { consent, mode } = useSiteConsent();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Owns the gtag "consent update" signal — an effect (not onDecision) so decisions made
  // in another tab or on the privacy page sync too. No stored decision → no update:
  // `<GoogleTag />`'s inline default already applies, and hydration's first render
  // (server snapshot = undecided) would otherwise emit a transient wrong update.
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
      <>
        {consent.needsPrompt || isSettingsOpen ? (
          <ConsentBannerCard
            consent={consent}
            // this branch already decided the banner shows — without `open`, the root would
            // re-gate on needsPrompt and refuse to reopen after a stored decision
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
      <ConsentToggle consent={consent} className="cursor-pointer text-ui-muted transition-colors hover:text-ui-fg" />
    </span>
  );
}
