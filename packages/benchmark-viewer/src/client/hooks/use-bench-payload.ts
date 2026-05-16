import { useState } from "react";
import type { EmbeddedViewerPayload } from "#/server-types";

interface BenchPayloadOptions {
  initialPayload: EmbeddedViewerPayload | undefined;
  onReloadError: (message: string) => void;
}

/**
 * @since 0.3.16-canary.1
 */
export function useBenchPayload({ initialPayload, onReloadError }: BenchPayloadOptions) {
  const [payload, setPayload] = useState<EmbeddedViewerPayload | null>(initialPayload ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  async function loadData(isReload = false) {
    if (isReload) {
      setIsReloading(true);
    }
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
    } finally {
      if (isReload) {
        setIsReloading(false);
      }
    }
  }

  return { payload, loadError, isReloading, loadData };
}
