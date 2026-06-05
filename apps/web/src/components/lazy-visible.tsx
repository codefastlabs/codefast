import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

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
 * SSR-safe: renders an empty placeholder on the server and on the first client
 * render (state starts false), so hydration matches; the IntersectionObserver
 * only swaps in the real children after mount.
 */
export function LazyVisible({ children, minHeight = 160, rootMargin = "300px" }: LazyVisibleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  // Once visible, drop the placeholder wrapper entirely and render children
  // directly so they inherit the parent's layout (flex/grid sizing). The div is
  // only needed before mount, as a stable target for the observer to watch and
  // to reserve height against layout shift.
  if (visible) {
    return <>{children}</>;
  }

  return <div ref={ref} style={{ minHeight }} />;
}
