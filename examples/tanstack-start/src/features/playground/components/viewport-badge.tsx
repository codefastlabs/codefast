import { Badge } from "@codefast/ui/badge";
import { useHasHydrated } from "@codefast/ui/hooks/use-has-hydrated";
import { useIsMobile } from "@codefast/ui/hooks/use-is-mobile";
import { useMediaQuery } from "@codefast/ui/hooks/use-media-query";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactElement } from "react";

type ViewportBadgeProps = Omit<ComponentProps<"div">, "children">;

/**
 * Live breakpoint readout from `useMediaQuery` + `useIsMobile`.
 *
 * Both hooks return `false` during SSR, so the live values are gated behind the hydration flag —
 * the first client paint matches the server markup and avoids a hydration mismatch.
 */
export function ViewportBadge({ className, ...props }: ViewportBadgeProps): ReactElement {
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const hydrated = useHasHydrated();

  const breakpoint = isMobile ? "mobile" : isTablet ? "tablet" : isDesktop ? "desktop" : "unknown";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      {hydrated ? (
        <>
          <Badge>{breakpoint}</Badge>
          <Badge variant="secondary">{isMobile ? "compact layout" : "wide layout"}</Badge>
          {prefersReducedMotion ? <Badge variant="outline">reduced motion</Badge> : null}
        </>
      ) : (
        <Badge variant="outline">resolving…</Badge>
      )}
    </div>
  );
}
