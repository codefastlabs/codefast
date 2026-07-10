import { createIsTrackingAllowed, hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
import type { ConsentRegion } from "@codefast/tracking/core";
import { resolveConsentMode } from "@codefast/tracking/core";
import { useSyncExternalStore } from "react";

import type { InitialConsent } from "#/features/tracking/lib/consent";
import {
  CONSENT_POLICY_VERSION,
  consentStorage,
  REQUESTED_CONSENT_CATEGORIES,
  STRICTEST_INITIAL_CONSENT,
} from "#/features/tracking/lib/consent";
import { resolveVisitorConsent } from "#/features/tracking/lib/resolve-visitor-consent";

/**
 * Session cache for the resolved region default, so only the first page load of a
 * session pays the server-function round trip — disclosed on the privacy page.
 */
export const INITIAL_CONSENT_SESSION_KEY = "codefast-ui-initial-consent";

export interface VisitorConsentSnapshot {
  /** The region-correct default once resolved; the strictest default until then. */
  initialConsent: InitialConsent;
  /**
   * True once a usable default is published — either a successful server answer or a
   * fail-closed fallback. A failed fetch still sets this so consent UI can render, but
   * does not lock the session: a later `ensureVisitorConsentResolved` may retry.
   */
  isResolved: boolean;
}

const listeners = new Set<() => void>();

let snapshot: VisitorConsentSnapshot = { initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: false };
let isFetchInFlight = false;
/** Sticky only after a successful resolve (or session-cache hit) — failures stay retryable. */
let hasResolvedSuccessfully = false;
let isRetryListening = false;

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function publishResolved(initialConsent: InitialConsent): void {
  hasResolvedSuccessfully = true;
  snapshot = { initialConsent, isResolved: true };
  stopResolveRetry();
  notify();
}

/** Fail-closed UI without permanently locking the SPA session against a later retry. */
function publishFailClosed(): void {
  snapshot = { initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: true };
  notify();
}

function stopResolveRetry(): void {
  if (!isRetryListening || typeof window === "undefined") {
    return;
  }

  isRetryListening = false;
  document.removeEventListener("visibilitychange", onResolveRetryResume);
  window.removeEventListener("pageshow", onResolveRetryResume);
}

function onResolveRetryResume(): void {
  if (hasResolvedSuccessfully) {
    stopResolveRetry();

    return;
  }

  if (document.visibilityState === "visible") {
    ensureVisitorConsentResolved();
  }
}

/** After a failed fetch, retry when the tab becomes visible again (coalesced by in-flight). */
function scheduleResolveRetry(): void {
  if (isRetryListening || typeof window === "undefined") {
    return;
  }

  isRetryListening = true;
  document.addEventListener("visibilitychange", onResolveRetryResume);
  window.addEventListener("pageshow", onResolveRetryResume);
}

function isConsentRegion(value: unknown): value is ConsentRegion {
  return value === "eu" || value === "other" || value === "us" || value === "vn";
}

function isInitialConsent(value: unknown): value is InitialConsent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const defaultConsent = candidate["defaultConsent"] as Record<string, unknown> | undefined;
  const mode = candidate["mode"];
  const region = candidate["region"];

  if (
    (mode !== "opt-in" && mode !== "opt-out") ||
    !isConsentRegion(region) ||
    typeof defaultConsent !== "object" ||
    defaultConsent === null ||
    typeof defaultConsent["ads"] !== "boolean" ||
    typeof defaultConsent["analytics"] !== "boolean"
  ) {
    return false;
  }

  // Fail-closed unknown-country bake uses region "other" with opt-in (stricter than other→opt-out).
  return mode === resolveConsentMode(region) || (mode === "opt-in" && region === "other");
}

function readSessionCache(): InitialConsent | undefined {
  try {
    const raw = window.sessionStorage.getItem(INITIAL_CONSENT_SESSION_KEY);
    const parsed: unknown = raw === null ? undefined : JSON.parse(raw);

    return isInitialConsent(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Kicks off region resolution over the server-function lane (at most one in-flight
 * request). A failure publishes the strictest default so consent UI still renders, but
 * stays retryable on the next call / tab-visible resume — not locked for the SPA lifetime.
 */
export function ensureVisitorConsentResolved(): void {
  if (hasResolvedSuccessfully || isFetchInFlight || typeof window === "undefined") {
    return;
  }

  const cached = readSessionCache();

  if (cached) {
    publishResolved(cached);

    return;
  }

  isFetchInFlight = true;

  resolveVisitorConsent()
    .then((resolved) => {
      try {
        window.sessionStorage.setItem(INITIAL_CONSENT_SESSION_KEY, JSON.stringify(resolved));
      } catch {
        // private mode / quota — resolve again next page load
      }

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

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

const SERVER_SNAPSHOT: VisitorConsentSnapshot = { initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: false };

/** Reactive view of the visitor's resolved consent default — updates once the server lane answers. */
export function useVisitorConsent(): VisitorConsentSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}

/**
 * Test seam — clears the resolved state and session cache so each test resolves fresh.
 */
export function resetVisitorConsentForTests(): void {
  stopResolveRetry();
  snapshot = { initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: false };
  isFetchInFlight = false;
  hasResolvedSuccessfully = false;

  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(INITIAL_CONSENT_SESSION_KEY);
  }
}

/** Non-React gate for `createClientTracker({ isTrackingAllowed })`. */
export const isTrackingAllowed = createIsTrackingAllowed({
  categories: REQUESTED_CONSENT_CATEGORIES,
  getMode: () => snapshot.initialConsent.mode,
  hasGlobalPrivacyControlSignal,
  policyVersion: CONSENT_POLICY_VERSION,
  storage: consentStorage,
});
