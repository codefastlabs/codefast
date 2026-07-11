import { Badge } from "@codefast/ui/badge";
import { useIsMobile } from "@codefast/ui/hooks/use-is-mobile";
import { useMediaQuery } from "@codefast/ui/hooks/use-media-query";
import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactElement } from "react";
import { useEffect, useState } from "react";

type ViewportBadgeProps = Omit<ComponentProps<"div">, "children">;

/**
 * Live breakpoint readout from `useMediaQuery` + `useIsMobile`.
 *
 * Both hooks return `false` during SSR, so the live values are gated behind a mount flag —
 * the first client paint matches the server markup and avoids a hydration mismatch.
 */
export function ViewportBadge({ className, ...props }: ViewportBadgeProps): ReactElement {
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const breakpoint = isMobile ? "mobile" : isTablet ? "tablet" : isDesktop ? "desktop" : "unknown";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      {mounted ? (
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
