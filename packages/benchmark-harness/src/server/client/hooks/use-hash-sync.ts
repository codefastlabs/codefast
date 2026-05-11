import { useEffect, useRef } from "react";
import { buildHash, parseHash, type ViewState } from "#/server/client/lib/hash";
import type { EmbeddedViewerPayload } from "#/server/server-types";

interface HashSyncOptions {
  payload: EmbeddedViewerPayload | null;
  view: ViewState;
  patchView: (patch: Partial<ViewState>) => void;
}

/**
 * @since 0.3.16-canary.1
 */
export function useHashSync({ payload, view, patchView }: HashSyncOptions) {
  const hashSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hashApplyingRef = useRef(false);

  // Apply URL hash on payload load
  useEffect(() => {
    if (!payload || typeof window === "undefined") {
      return;
    }
    const raw = window.location.hash;
    if (!raw || raw.length < 2) {
      return;
    }
    hashApplyingRef.current = true;
    try {
      const patch = parseHash(raw, payload);
      if (Object.keys(patch).length > 0) {
        patchView(patch);
      }
    } finally {
      hashApplyingRef.current = false;
    }
  }, [payload, patchView]);

  // Sync URL hash on view change (debounced 120 ms)
  useEffect(() => {
    if (!payload || typeof window === "undefined" || hashApplyingRef.current) {
      return;
    }
    if (hashSyncTimerRef.current) {
      clearTimeout(hashSyncTimerRef.current);
    }
    hashSyncTimerRef.current = setTimeout(() => {
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
  }, [view, payload]);
}
