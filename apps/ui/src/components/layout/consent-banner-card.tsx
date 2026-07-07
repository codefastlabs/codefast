import type { UseConsentResult } from "@codefast/tracking/react";
import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

export interface ConsentBannerCardProps extends Omit<ComponentProps<"section">, "children"> {
  consent: UseConsentResult;
  /** Fires after the visitor decides — lets `<ConsentGate />` close the reopened settings view. */
  onDecision?: () => void;
}

/**
 * The styled consent prompt, composed from `@codefast/ui` on top of `useConsent` —
 * the headless `ConsentBanner` can't host a heading (its message slot is a `<p>`) or
 * the design system's `Button` hierarchy, so the markup lives here instead. A plain
 * `<a>` links the policy: the banner only exists post-hydration as a fixed overlay,
 * so a full-page navigation costs nothing and keeps the component router-free.
 */
export function ConsentBannerCard({ className, consent, onDecision, ...props }: ConsentBannerCardProps) {
  return (
    <section
      aria-labelledby="consent-banner-title"
      className={cn(
        "fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm animate-in rounded-2xl border border-ui-border/60 bg-ui-card p-5 shadow-xl shadow-black/10 ease-gentle animation-duration-overlay-in fade-in-0 slide-in-from-bottom-4 sm:inset-x-auto sm:end-4 dark:shadow-black/30",
        className,
      )}
      {...props}
    >
      <h2 className="mb-1.5 text-sm font-semibold text-ui-fg" id="consent-banner-title">
        Cookies &amp; analytics
      </h2>
      <p className="mb-4 text-sm leading-6 text-ui-muted">
        We use analytics cookies to understand how this site is used and improve it. No ads, no cross-site tracking.{" "}
        <a className="text-ui-fg underline underline-offset-4 hover:text-ui-brand" href="/privacy">
          Privacy policy
        </a>
      </p>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          size="sm"
          onClick={() => {
            consent.grantAll();
            onDecision?.();
          }}
        >
          Accept
        </Button>
        <Button
          className="flex-1"
          size="sm"
          variant="outline"
          onClick={() => {
            consent.denyAll();
            onDecision?.();
          }}
        >
          Reject
        </Button>
      </div>
    </section>
  );
}
