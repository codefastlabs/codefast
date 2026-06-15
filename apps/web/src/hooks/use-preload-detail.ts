import { useCallback, useEffect, useRef } from "react";

import { preloadDetail } from "#/components/detail/detail-body";

const PRELOAD_DEBOUNCE_MS = 80;

/** Warms a component detail chunk on hover/focus — best-effort, debounced per slug. */
export function usePreloadDetail(slug: string | undefined): {
  readonly onMouseEnter: () => void;
  readonly onFocus: () => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadedRef = useRef(false);

  const schedulePreload = useCallback(() => {
    if (!slug || preloadedRef.current) {
      return;
    }

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      preloadedRef.current = true;
      preloadDetail(slug);
    }, PRELOAD_DEBOUNCE_MS);
  }, [slug]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    onMouseEnter: schedulePreload,
    onFocus: schedulePreload,
  };
}
