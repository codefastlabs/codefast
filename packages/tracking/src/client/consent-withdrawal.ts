import type { ConsentDecision } from "#/core/consent";

/**
 * @since 1.0.0-canary.6
 */
export interface ConsentWithdrawalHandlerOptions {
  /** Forget the cookie-backed visitor id when analytics is denied. */
  clearAnonymousId?: (() => void) | undefined;
  /** Expire Google's `_ga` / `_ga_*` cookies when analytics is denied. */
  clearGoogleAnalyticsCookies?: (() => void) | undefined;
}

/**
 * `useConsent({ onDecision })` handler that clears first-party tracking state when the
 * visitor denies (or withdraws) analytics. Grant paths are a no-op.
 *
 * @since 1.0.0-canary.6
 */
export function createConsentWithdrawalHandler(
  options: ConsentWithdrawalHandlerOptions,
): (decision: ConsentDecision) => void {
  const { clearAnonymousId, clearGoogleAnalyticsCookies } = options;

  return (decision: ConsentDecision): void => {
    if (decision.analytics) {
      return;
    }

    clearAnonymousId?.();
    clearGoogleAnalyticsCookies?.();
  };
}
