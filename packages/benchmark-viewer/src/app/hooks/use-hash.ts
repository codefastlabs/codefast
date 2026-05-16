import { useEffect, useRef } from "react";
import { buildHash, parseHash, type ViewState } from "#/app/lib/hash";
import type { EmbeddedViewerPayload } from "#/types";

interface HashSyncOptions {
  payload: EmbeddedViewerPayload | null;
  view: ViewState;
  patchView: (patch: Partial<ViewState>) => void;
}

export function useHashSync({ payload, view, patchView }: HashSyncOptions) {
  const initializedRef = useRef(false);

  // Parse URL hash once on first payload load.
  // Using initializedRef instead of the old hashApplyingRef pattern: the previous
  // approach cleared the flag synchronously before setState flushed, allowing the
  // view-sync effect below to race and overwrite the hash with defaults on the same
  // render cycle. One-shot initialization is simpler and correct.
  useEffect(() => {
    if (!payload || initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    const raw = window.location.hash;
    if (!raw || raw.length < 2) {
      return;
    }
    const patch = parseHash(raw, payload);
    if (Object.keys(patch).length > 0) {
      patchView(patch);
    }
  }, [payload, patchView]);

  // Sync URL hash on view change (debounced 120 ms).
  // Returning the cleanup cancels any in-flight timer on unmount or before the next
  // run — previously the timer was stored in a ref and never cancelled on unmount.
  useEffect(() => {
    if (!payload) {
      return;
    }
    const timer = setTimeout(() => {
      const next = buildHash(view);
      const withHash = next ? `#${next}` : "";
      if (window.location.hash === withHash) {
        return;
      }
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search + withHash,
      );
    }, 120);
    return () => clearTimeout(timer);
  }, [view, payload]);
}
