import { createIsTrackingAllowed, hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
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
export const VISITOR_CONSENT_SESSION_KEY = "codefast-ui-region";

export interface VisitorConsentSnapshot {
  /** The region-correct default once resolved; the strictest default until then. */
  initialConsent: InitialConsent;
  /** True once the server lane answered (or failed — the strictest default then stands). */
  isResolved: boolean;
}

const listeners = new Set<() => void>();

let snapshot: VisitorConsentSnapshot = { initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: false };
let isFetchInFlight = false;

function publish(initialConsent: InitialConsent): void {
  snapshot = { initialConsent, isResolved: true };

  for (const listener of listeners) {
    listener();
  }
}

function isInitialConsent(value: unknown): value is InitialConsent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const defaultConsent = candidate["defaultConsent"] as Record<string, unknown> | undefined;

  return (
    (candidate["mode"] === "opt-in" || candidate["mode"] === "opt-out") &&
    typeof candidate["region"] === "string" &&
    typeof defaultConsent === "object" &&
    defaultConsent !== null &&
    typeof defaultConsent["ads"] === "boolean" &&
    typeof defaultConsent["analytics"] === "boolean"
  );
}

function readSessionCache(): InitialConsent | undefined {
  try {
    const raw = window.sessionStorage.getItem(VISITOR_CONSENT_SESSION_KEY);
    const parsed: unknown = raw === null ? undefined : JSON.parse(raw);

    return isInitialConsent(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Kicks off the one-per-page-load region resolution over the server-function lane.
 * A failure (offline, host without a geo header) publishes the strictest default as
 * final — fail-closed, and the consent UI still renders.
 */
export function ensureVisitorConsentResolved(): void {
  if (snapshot.isResolved || isFetchInFlight || typeof window === "undefined") {
    return;
  }

  const cached = readSessionCache();

  if (cached) {
    publish(cached);

    return;
  }

  isFetchInFlight = true;

  resolveVisitorConsent()
    .then((resolved) => {
      try {
        window.sessionStorage.setItem(VISITOR_CONSENT_SESSION_KEY, JSON.stringify(resolved));
      } catch {
        // private mode / quota — resolve again next page load
      }

      publish(resolved);
    })
    .catch(() => {
      publish(STRICTEST_INITIAL_CONSENT);
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
  snapshot = { initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: false };
  isFetchInFlight = false;

  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(VISITOR_CONSENT_SESSION_KEY);
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
