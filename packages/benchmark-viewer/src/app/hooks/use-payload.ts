import { useCallback, useState, useTransition } from "react";
import type { EmbeddedViewerPayload } from "#/types";

interface BenchPayloadOptions {
  initialPayload: EmbeddedViewerPayload | undefined;
  onReloadError: (message: string) => void;
}

export function useBenchPayload({ initialPayload, onReloadError }: BenchPayloadOptions) {
  const [payload, setPayload] = useState<EmbeddedViewerPayload | null>(initialPayload ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // React 19 async transitions: startReload accepts an async action and keeps
  // isReloading true for the entire duration, including async work (awaits).
  // This replaces the previous manual setIsReloading(true/false) pattern and
  // the separate isReloading state variable.
  const [isReloading, startReload] = useTransition();

  const loadData = useCallback(
    (isReload = false) => {
      startReload(async () => {
        try {
          const res = await fetch("/api/payload", { cache: "no-store" });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const data = (await res.json()) as EmbeddedViewerPayload;
          setPayload(data);
          setLoadError(null);
        } catch (err) {
          if (isReload) {
            onReloadError(`Could not reload data: ${String(err)}`);
          } else {
            setLoadError(String(err));
          }
        }
      });
    },
    [onReloadError],
  );

  return { payload, loadError, isReloading, loadData };
}
