import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  /** How far outside the viewport to trigger ahead of scrolling (CSS margin syntax). */
  readonly rootMargin?: string;
}

/**
 * Watches the returned `ref` and flips `inView` to `true` the first time it scrolls
 * within `rootMargin` of the viewport, then disconnects — a one-way latch for
 * deferring expensive work (mounting heavy demos, lazy media) until it's near the
 * fold. SSR-safe: starts `false` so the server and first client render agree.
 */
export function useInView<T extends Element = HTMLDivElement>(
  options?: UseInViewOptions,
): {
  ref: RefObject<T | null>;
  inView: boolean;
} {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const rootMargin = options?.rootMargin ?? "0px";

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
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

  return { ref, inView };
}
