// Vendored from shadcn-ui/ui packages/react/src/message-scroller/utils.ts
import { useRef } from "react";

function useLatest<T>(value: T) {
  const ref = useRef(value);

  ref.current = value;

  return ref;
}

export { useLatest };
