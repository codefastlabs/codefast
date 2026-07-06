import { useRef } from "react";

/**
 * @since 0.5.0-canary.3
 */
function useLatest<T>(value: T) {
  const ref = useRef(value);

  ref.current = value;

  return ref;
}

export { useLatest };
