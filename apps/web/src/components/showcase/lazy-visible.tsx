import type { ReactNode } from "react";

import { PreviewSkeleton } from "#/components/showcase/preview-skeleton";
import { useInView } from "#/hooks/use-in-view";

interface LazyVisibleProps {
  children: ReactNode;
  /** Reserved height for the placeholder before mount, to avoid layout shift. */
  minHeight?: number;
  /** How far outside the viewport (px) to mount ahead of scrolling. */
  rootMargin?: string;
}

/**
 * Defers mounting its children until they scroll near the viewport. Heavy demos
 * (recharts, embla, @daypicker/react, …) otherwise all mount and run effects on
 * first paint of the gallery.
 *
 * SSR-safe: renders a skeleton placeholder on the server and on the first client
 * render (state starts false), so hydration matches; the IntersectionObserver
 * only swaps in the real children after mount.
 */
export function LazyVisible({ children, minHeight = 160, rootMargin = "300px" }: LazyVisibleProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin });

  // Once visible, drop the placeholder wrapper entirely and render children
  // directly so they inherit the parent's layout (flex/grid sizing). The div is
  // only needed before mount, as a stable target for the observer to watch and
  // to reserve height against layout shift.
  if (inView) {
    return <>{children}</>;
  }

  return (
    <div ref={ref} className="w-full">
      <PreviewSkeleton minHeight={minHeight} />
    </div>
  );
}
