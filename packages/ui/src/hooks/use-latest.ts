import type { RefObject } from "react";
import { useLayoutEffect, useRef } from "react";

/**
 * Returns a ref that always holds the latest value.
 *
 * The mirror runs in a layout effect, so every post-commit reader — later layout
 * effects, MutationObserver callbacks, event handlers — sees the current render's
 * value without a forbidden write during render.
 *
 * @since 0.5.0-canary.3
 */
function useLatest<Value>(value: Value): RefObject<Value> {
  const ref = useRef(value);

  useLayoutEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

export { useLatest };
