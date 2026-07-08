import { hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
import { Switch } from "@codefast/ui/switch";
import type { ReactNode } from "react";

import { useSiteConsent } from "#/lib/site-consent";
import { useHasHydrated } from "#/lib/use-has-hydrated";

/**
 * The interactive "Your privacy choices" panel on `/privacy`: a switch over the site's
 * own analytics consent (the same stored decision the banner and footer control write),
 * plus a read-only Global Privacy Control row. The panel prerenders statically — the
 * switch is disabled and the GPC row generic until hydration, because both depend on
 * browser-only state. This site sells or shares no personal data and runs no ads, so a
 * GPC signal is acknowledged rather than acted on — the analytics switch is the control.
 */
export function PrivacyChoices() {
  const { consent } = useSiteConsent();
  const hasHydrated = useHasHydrated();
  const isGpcDetected = hasHydrated && hasGlobalPrivacyControlSignal();

  const gpcLink = (
    <a
      className="text-ui-fg underline underline-offset-4 hover:text-ui-brand"
      href="https://globalprivacycontrol.org"
      rel="noreferrer"
      target="_blank"
    >
      globalprivacycontrol.org
    </a>
  );

  let gpcStatus: ReactNode;

  if (!hasHydrated) {
    gpcStatus = <>A browser setting that asks sites not to sell or share your personal data — see {gpcLink}.</>;
  } else if (isGpcDetected) {
    gpcStatus = (
      <>
        Signal detected. This site never sells or shares personal data and runs no ads, so there is nothing here for the
        signal to turn off — the analytics switch above stays the one control.
      </>
    );
  } else {
    gpcStatus = (
      <>
        Your browser isn&rsquo;t sending the GPC signal. It&rsquo;s a browser setting, not something this site can
        switch on for you — see {gpcLink} to enable it.
      </>
    );
  }

  return (
    <div className="rounded-2xl border border-ui-border/60 bg-ui-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ui-fg">Analytics</p>
          <p className="text-xs leading-5 text-ui-muted">
            Anonymous usage measurement — page views, docs searches, copied snippets.
          </p>
        </div>
        <Switch
          aria-label="Allow analytics"
          checked={hasHydrated ? consent.effectiveConsent.analytics : false}
          disabled={!hasHydrated}
          onCheckedChange={(checked) => {
            if (checked) {
              consent.grantAll();
            } else {
              consent.denyAll();
            }
          }}
        />
      </div>
      <div className="mt-4 border-t border-ui-border/60 pt-4">
        <p className="text-sm font-medium text-ui-fg">Global Privacy Control</p>
        <p className="text-xs leading-5 text-ui-muted">{gpcStatus}</p>
      </div>
    </div>
  );
}
