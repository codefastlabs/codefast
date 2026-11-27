"use client";

import { useEffect } from "react";

import { updateGoogleConsent } from "#destinations/google-analytics";
import type { UseConsentResult } from "#react/use-consent";

/**
 * Options for `useGoogleConsentSync`.
 *
 * @since 0.5.0-canary.6
 */
export interface UseGoogleConsentSyncOptions {
  /**
   * Idempotent gtag.js load — advanced Consent Mode already injects the tag from a
   * bootstrap; pass a loader as a safety net after a runtime grant.
   */
  loadGtagScript?: (() => void) | undefined;
}

/**
 * Keeps Google Consent Mode v2 in sync with `useConsent`: emits the effective consent as an
 * `update` once a stored decision exists (including cross-tab / privacy-page saves), and
 * optionally loads gtag when analytics is effective. Mount once on a page-wide surface (e.g. the footer gate).
 *
 * @since 0.5.0-canary.6
 */
export function useGoogleConsentSync(consent: UseConsentResult, options: UseGoogleConsentSyncOptions = {}): void {
  const { loadGtagScript } = options;

  const hasDecision = consent.decision !== undefined;
  const { effectiveConsent } = consent;

  useEffect(() => {
    // The effective consent, not the stored record, so GPC keeps a stored `ads` grant denied in gtag too.
    if (hasDecision) {
      updateGoogleConsent(effectiveConsent);
    }

    if (effectiveConsent.analytics) {
      loadGtagScript?.();
    }
  }, [hasDecision, effectiveConsent, loadGtagScript]);
}
