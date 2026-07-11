import type { InitialConsent } from "#/core/consent";
import { isInitialConsent, STRICTEST_INITIAL_CONSENT } from "#/core/consent";

/**
 * External-store view of the visitor's region default — the strictest value until the
 * server lane answers, then the resolved one.
 */
export interface InitialConsentSnapshot {
  /** The region-correct default once resolved; {@link STRICTEST_INITIAL_CONSENT} until then. */
  initialConsent: InitialConsent;
  /**
   * True once a usable default is published — either a successful server answer or a
   * fail-closed fallback. A failed fetch still sets this so consent UI can render, but
   * does not lock the session: resolution stays retryable.
   */
  isResolved: boolean;
}

export interface InitialConsentStoreOptions {
  /**
   * The per-visitor server lane — typically a server function wrapping
   * `resolveInitialConsentFromRequest`. Prerendered/CDN-cached HTML can carry nothing
   * region-specific, so this is the only place the region-correct default may come from.
   */
  resolve: () => Promise<InitialConsent>;
  /**
   * `sessionStorage` key caching the resolved value, so only the first page load of a
   * session pays the round trip — omit to resolve once per page load instead. Cached
   * values are re-validated with `isInitialConsent` before use.
   */
  sessionStorageKey?: string | undefined;
}

/**
 * `useSyncExternalStore`-shaped — pass `subscribe`/`getSnapshot`/`getServerSnapshot`
 * straight through, or use the `useInitialConsent` hook from `@codefast/tracking/react`.
 */
export interface InitialConsentStore {
  /**
   * Kicks off region resolution (at most one in-flight request; a success is sticky for
   * the store's lifetime). Call it early — e.g. at router creation, window-guarded — so
   * the round trip overlaps hydration instead of waiting for the first effect.
   */
  ensureResolved: () => void;
  getServerSnapshot: () => InitialConsentSnapshot;
  getSnapshot: () => InitialConsentSnapshot;
  /** Test seam — clears resolved state, retry listeners, and the session cache. */
  reset: () => void;
  subscribe: (listener: () => void) => () => void;
}

const SERVER_SNAPSHOT: InitialConsentSnapshot = {
  initialConsent: STRICTEST_INITIAL_CONSENT,
  isResolved: false,
};

/**
 * The client half of the server-resolved consent lane: single-flight resolution over the
 * given server function, an optional per-session cache, fail-closed publishing on error
 * (consent UI still renders, under the strictest default), and a retry the next time the
 * tab becomes visible — so one failed request never locks the whole SPA session.
 */
export function createInitialConsentStore(options: InitialConsentStoreOptions): InitialConsentStore {
  const listeners = new Set<() => void>();

  let snapshot: InitialConsentSnapshot = SERVER_SNAPSHOT;
  let isFetchInFlight = false;
  /** Sticky only after a successful resolve (or session-cache hit) — failures stay retryable. */
  let hasResolvedSuccessfully = false;

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  // add/removeEventListener dedupe an identical listener, so no armed-flag is needed.
  function stopResolveRetry(): void {
    if (typeof window === "undefined") {
      return;
    }

    document.removeEventListener("visibilitychange", onResolveRetryResume);
    window.removeEventListener("pageshow", onResolveRetryResume);
    window.removeEventListener("online", onResolveRetryResume);
  }

  function onResolveRetryResume(): void {
    if (hasResolvedSuccessfully) {
      stopResolveRetry();

      return;
    }

    if (document.visibilityState === "visible") {
      ensureResolved();
    }
  }

  /**
   * After a failed fetch, retry when the tab becomes visible again or connectivity
   * returns (coalesced by in-flight) — a visitor who never leaves the tab must not stay
   * fail-closed for the whole session over one network blip.
   */
  function scheduleResolveRetry(): void {
    if (typeof window === "undefined") {
      return;
    }

    document.addEventListener("visibilitychange", onResolveRetryResume);
    window.addEventListener("pageshow", onResolveRetryResume);
    window.addEventListener("online", onResolveRetryResume);
  }

  function publishResolved(initialConsent: InitialConsent): void {
    hasResolvedSuccessfully = true;
    snapshot = { initialConsent, isResolved: true };
    stopResolveRetry();
    notify();
  }

  /** Fail-closed UI without permanently locking the session against a later retry. */
  function publishFailClosed(): void {
    snapshot = { initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: true };
    notify();
  }

  function readSessionCache(): InitialConsent | undefined {
    if (options.sessionStorageKey === undefined) {
      return undefined;
    }

    try {
      const raw = window.sessionStorage.getItem(options.sessionStorageKey);
      const parsed: unknown = raw === null ? undefined : JSON.parse(raw);

      return isInitialConsent(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  function writeSessionCache(resolved: InitialConsent): void {
    if (options.sessionStorageKey === undefined) {
      return;
    }

    try {
      window.sessionStorage.setItem(options.sessionStorageKey, JSON.stringify(resolved));
    } catch {
      /* private mode / quota — resolve again next page load */
    }
  }

  function ensureResolved(): void {
    if (hasResolvedSuccessfully || isFetchInFlight || typeof window === "undefined") {
      return;
    }

    const cached = readSessionCache();

    if (cached) {
      publishResolved(cached);

      return;
    }

    isFetchInFlight = true;

    // Promise.resolve().then(...) folds a synchronously throwing resolver into the same
    // fail-closed path — tracking must never break the caller (a React mount effect).
    Promise.resolve()
      .then(() => options.resolve())
      .then((resolved) => {
        writeSessionCache(resolved);
        publishResolved(resolved);
      })
      .catch(() => {
        publishFailClosed();
        scheduleResolveRetry();
      })
      .finally(() => {
        isFetchInFlight = false;
      });
  }

  return {
    ensureResolved,
    getServerSnapshot: () => SERVER_SNAPSHOT,
    getSnapshot: () => snapshot,
    reset(): void {
      stopResolveRetry();
      snapshot = SERVER_SNAPSHOT;
      isFetchInFlight = false;
      hasResolvedSuccessfully = false;

      if (typeof window !== "undefined" && options.sessionStorageKey !== undefined) {
        window.sessionStorage.removeItem(options.sessionStorageKey);
      }
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
