import type { ConsentDecision } from "#/core/consent";
import type { Destination } from "#/core/destination";
import { toAdConsentState } from "#/destinations/ad-consent";
import type { FlatPropertyValue } from "#/destinations/shared";
import { flattenEventProps } from "#/destinations/shared";

/**
 * TikTok consent. TikTok uses a **single Limited Data Use boolean**, not Meta's
 * `dataProcessingOptions` structure and no signal object (spec-destinations §5). Its
 * transmission gate (`ttq.grantConsent()`/`revokeConsent()`) follows `analytics` and is the
 * tracker's job; this models the `ads`-driven LDU lever.
 *
 * @since 1.0.0-canary.7
 */
export interface TiktokConsent {
  limited_data_use: boolean;
}

/**
 * Maps a `ConsentDecision` to TikTok's LDU boolean — on when `ads` is denied.
 *
 * @since 1.0.0-canary.7
 */
export function toTiktokConsent(decision: ConsentDecision): TiktokConsent {
  return { limited_data_use: toAdConsentState(decision).limitedDataUse };
}

/**
 * The mapped per-event payload handed to a TikTok transport (`ttq.track` / Events API).
 *
 * @since 1.0.0-canary.7
 */
export interface TiktokEventPayload {
  consent: TiktokConsent;
  name: string;
  properties: Record<string, FlatPropertyValue>;
}

/**
 * @since 1.0.0-canary.7
 */
export interface TiktokDestinationOptions {
  /** Erasure cookie-clear seam — TikTok exposes no per-visitor deletion API, so erasure is cookie-clear + stop-send (DSR-V4). */
  clearCookies?: (() => void) | undefined;
  /** Read per event so an `ads` change flips LDU without recreating the destination. */
  getDecision: () => ConsentDecision;
  name?: string | undefined;
  /**
   * Delivers one mapped event — the transport seam. Wire it to `ttq.track(...)` (Pixel) or the
   * Events API; this package ships the consent mapping, never the pixel id or network client.
   */
  transport: (payload: TiktokEventPayload) => Promise<void> | void;
}

/**
 * Reference ad destination for TikTok: maps each event and the live `ads` decision to
 * TikTok's LDU boolean, then hands it to an injected transport. Consent-restriction mapping
 * only — the pixel id and `ttq` transport are the integrator's. `consentRequirement` stays
 * `"required"`.
 *
 * @since 1.0.0-canary.7
 */
export function createTiktokDestination(options: TiktokDestinationOptions): Destination {
  let stopped = false;

  return {
    consentRequirement: "required",
    name: options.name ?? "tiktok",
    onErasure() {
      stopped = true;
      options.clearCookies?.();
    },
    async send(event) {
      if (stopped) {
        return;
      }

      await options.transport({
        consent: toTiktokConsent(options.getDecision()),
        name: event.name,
        properties: flattenEventProps(event.properties),
      });
    },
  };
}
