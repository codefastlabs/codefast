import type { ReactElement, ReactNode, Ref } from "react";
import { cloneElement } from "react";

import { PreviewSkeleton } from "#/components/showcase/preview-skeleton";
import { useInView } from "#/hooks/use-in-view";

interface LazyVisibleProps {
  children: ReactNode;
  /**
   * Placeholder rendered before the children mount. LazyVisible injects the
   * IntersectionObserver target `ref` into it, so it must forward `ref` to its
   * outermost DOM node (PreviewSkeleton and the @codefast/ui primitives already do).
   * Defaults to a {@link PreviewSkeleton} sized by `minHeight`.
   */
  fallback?: ReactElement<{ ref?: Ref<HTMLDivElement> }>;
  /** Reserved height for the default skeleton placeholder, to avoid layout shift. */
  minHeight?: number;
  /** How far outside the viewport (px) to mount ahead of scrolling. */
  rootMargin?: string;
}

/**
 * Defers mounting its children until they scroll near the viewport. Heavy demos
 * (recharts, embla, @daypicker/react, …) otherwise all mount and run effects on
 * first paint of the gallery.
 *
 * SSR-safe: renders the fallback placeholder on the server and on the first client
 * render (state starts false), so hydration matches; the IntersectionObserver only
 * swaps in the real children after mount.
 */
export function LazyVisible({ children, fallback, minHeight = 112, rootMargin = "300px" }: LazyVisibleProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ rootMargin });

  // Once visible, render children directly so they inherit the parent's layout
  // (flex/grid sizing); the placeholder is only the observer's target until then.
  if (inView) {
    return <>{children}</>;
  }

  const placeholder: ReactElement<{ ref?: Ref<HTMLDivElement> }> = fallback ?? (
    <PreviewSkeleton minHeight={minHeight} className="w-full" />
  );

  return cloneElement(placeholder, { ref });
}
