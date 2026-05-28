import { useCallback, useState, useTransition } from "react";
import { DEFAULT_MAX_RUNS } from "#/constants";
import type { EmbeddedViewerPayload } from "#/types";

interface BenchPayloadOptions {
  initialPayload: EmbeddedViewerPayload | undefined;
  onReloadError: (message: string) => void;
}

async function fetchPayload(limit: number): Promise<EmbeddedViewerPayload> {
  const url = `/api/payload?limit=${String(limit)}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)}`);
  }
  return response.json() as Promise<EmbeddedViewerPayload>;
}

/**
 * @since 0.3.16-canary.3
 */
export function useBenchPayload({ initialPayload, onReloadError }: BenchPayloadOptions) {
  const [payload, setPayload] = useState<EmbeddedViewerPayload | null>(initialPayload ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeLimit, setActiveLimit] = useState(
    initialPayload?.effectiveLimit ?? DEFAULT_MAX_RUNS,
  );

  const [isReloading, startReload] = useTransition();

  const loadData = useCallback(
    (isReload = false, limit = activeLimit) => {
      startReload(async () => {
        try {
          const data = await fetchPayload(limit);
          setPayload(data);
          setActiveLimit(data.effectiveLimit);
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
    [activeLimit, onReloadError],
  );

  const loadOlderRuns = useCallback(() => {
    loadData(false, activeLimit * 2);
  }, [loadData, activeLimit]);

  return { payload, loadError, isReloading, loadData, loadOlderRuns };
}
