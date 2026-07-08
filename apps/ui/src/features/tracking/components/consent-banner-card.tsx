import {
  ConsentBanner,
  ConsentBannerAccept,
  ConsentBannerActions,
  ConsentBannerCategory,
  ConsentBannerCustomize,
  ConsentBannerDescription,
  ConsentBannerPreferences,
  ConsentBannerReject,
  ConsentBannerSave,
  ConsentBannerTitle,
} from "@codefast/tracking/react";
import { cn } from "@codefast/ui/lib/utils";
import { buttonVariants } from "@codefast/ui/variants/button";
import type { ComponentProps } from "react";

export interface ConsentBannerCardProps extends Omit<ComponentProps<typeof ConsentBanner>, "children"> {
  /** Fires after the visitor decides — lets `<ConsentGate />` close the reopened settings view. */
  onDecision?: () => void;
}

/**
 * This site's styling of `@codefast/tracking`'s composable banner parts — the package
 * owns the consent logic and a11y semantics, the design system supplies the button
 * styles via `buttonVariants`. A plain `<a>` links the policy: the banner only exists
 * post-hydration as a fixed overlay, so a full-page navigation costs nothing and keeps
 * the component router-free.
 */
export function ConsentBannerCard({ className, onDecision, ...props }: ConsentBannerCardProps) {
  return (
    <ConsentBanner
      className={cn(
        "fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm animate-in rounded-2xl border border-ui-border/60 bg-ui-card p-5 shadow-xl shadow-black/10 ease-gentle animation-duration-overlay-in fade-in-0 slide-in-from-bottom-4 sm:inset-x-auto sm:inset-e-4 dark:shadow-black/30",
        className,
      )}
      {...props}
    >
      <ConsentBannerTitle className="mb-1.5 text-sm font-semibold text-ui-fg">
        Cookies &amp; analytics
      </ConsentBannerTitle>
      <ConsentBannerDescription className="mb-4 text-sm leading-6 text-ui-muted">
        We use analytics cookies to understand how this site is used and improve it. No ads, no cross-site tracking.{" "}
        <a className="text-ui-fg underline underline-offset-4 hover:text-ui-brand" href="/privacy">
          Privacy policy
        </a>
      </ConsentBannerDescription>
      <ConsentBannerPreferences className="mb-4 flex flex-col gap-2">
        <ConsentBannerCategory category="analytics" className="flex items-baseline gap-2 text-sm text-ui-fg">
          <span>
            Analytics
            <span className="block text-xs leading-5 text-ui-muted">
              Anonymous usage measurement — page views, docs searches, copied snippets.
            </span>
          </span>
        </ConsentBannerCategory>
      </ConsentBannerPreferences>
      <ConsentBannerActions className="flex gap-2">
        {/* the prompt-state pair yields to Save while the preferences layer is open */}
        <ConsentBannerAccept
          className={cn(buttonVariants({ size: "sm" }), "flex-1 in-data-[state=preferences]:hidden")}
          onClick={onDecision}
        >
          Accept
        </ConsentBannerAccept>
        <ConsentBannerReject
          className={cn(
            buttonVariants({ size: "sm", variant: "outline" }),
            "flex-1 in-data-[state=preferences]:hidden",
          )}
          onClick={onDecision}
        >
          Reject
        </ConsentBannerReject>
        <ConsentBannerCustomize className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "flex-1")}>
          Customize
        </ConsentBannerCustomize>
        <ConsentBannerSave className={cn(buttonVariants({ size: "sm" }), "flex-1")} onClick={onDecision}>
          Save preferences
        </ConsentBannerSave>
      </ConsentBannerActions>
    </ConsentBanner>
  );
}
