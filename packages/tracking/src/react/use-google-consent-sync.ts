"use client";

import { useEffect } from "react";

import { updateGoogleConsent } from "#/destinations/google-analytics";
import type { UseConsentResult } from "#/react/use-consent";

export interface UseGoogleConsentSyncOptions {
  /**
   * Idempotent gtag.js load — advanced Consent Mode already injects the tag from a
   * bootstrap; pass a loader as a safety net after a runtime grant.
   */
  loadGtagScript?: (() => void) | undefined;
}

/**
 * Keeps Google Consent Mode v2 in sync with `useConsent`: emits `update` when a stored
 * decision exists (including cross-tab / privacy-page saves), and optionally loads gtag
 * when analytics is effective. Mount once on a page-wide surface (e.g. the footer gate).
 */
export function useGoogleConsentSync(consent: UseConsentResult, options: UseGoogleConsentSyncOptions = {}): void {
  const { loadGtagScript } = options;

  useEffect(() => {
    if (consent.decision !== undefined) {
      updateGoogleConsent(consent.decision);
    }

    if (consent.effectiveConsent.analytics) {
      loadGtagScript?.();
    }
  }, [consent.decision, consent.effectiveConsent.analytics, loadGtagScript]);
}
