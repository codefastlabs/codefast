import { hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
import { Switch } from "@codefast/ui/switch";

import { useSiteConsent } from "#/lib/site-consent";
import { useHasHydrated } from "#/lib/use-has-hydrated";

/**
 * The interactive "Your privacy choices" panel on `/privacy`: a switch over the site's
 * own analytics consent (the same stored decision the banner and footer control write),
 * plus a read-only Global Privacy Control row — GPC is a browser-side signal this site
 * can only receive and honor, never set, so it renders as detection status, not a switch.
 */
export function PrivacyChoices() {
  const { consent } = useSiteConsent();
  const hasHydrated = useHasHydrated();

  if (!hasHydrated) {
    return null;
  }

  const isGpcDetected = hasGlobalPrivacyControlSignal();

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
          checked={consent.effectiveConsent.analytics}
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
        <p className="text-xs leading-5 text-ui-muted">
          {isGpcDetected ? (
            <>Signal detected — your browser asks us not to sell or share your data, and we honor it.</>
          ) : (
            <>
              Your browser isn&rsquo;t sending the GPC signal. It&rsquo;s a browser setting, not something this site can
              switch on for you — see{" "}
              <a
                className="text-ui-fg underline underline-offset-4 hover:text-ui-brand"
                href="https://globalprivacycontrol.org"
                rel="noreferrer"
                target="_blank"
              >
                globalprivacycontrol.org
              </a>{" "}
              to enable it.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
