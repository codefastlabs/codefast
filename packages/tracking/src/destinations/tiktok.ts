import type { ConsentDecision } from "#core/consent";
import type { Destination } from "#core/destination";
import { resolveAdDecision, toAdConsentState } from "#destinations/ad-consent";
import type { FlatPropertyValue } from "#destinations/shared";
import { flattenEventProps } from "#destinations/shared";

/**
 * TikTok consent. TikTok uses a **single Limited Data Use boolean**, not Meta's
 * `dataProcessingOptions` structure and no signal object. Its
 * transmission gate (`ttq.grantConsent()`/`revokeConsent()`) is the tracker's job, through the
 * destination's `isPermittedBy`; this models the `ads`-driven LDU lever.
 *
 * @since 0.5.0-canary.6
 */
export interface TiktokConsent {
  limited_data_use: boolean;
}

/**
 * Maps a `ConsentDecision` to TikTok's LDU boolean — on when `ads` is denied.
 *
 * @since 0.5.0-canary.6
 */
export function toTiktokConsent(decision: ConsentDecision): TiktokConsent {
  return { limited_data_use: toAdConsentState(decision).limitedDataUse };
}

/**
 * The mapped per-event payload handed to a TikTok transport (`ttq.track` / Events API).
 *
 * @since 0.5.0-canary.6
 */
export interface TiktokEventPayload {
  consent: TiktokConsent;
  name: string;
  properties: Record<string, FlatPropertyValue>;
}

/**
 * Options for `createTiktokDestination`.
 *
 * @since 0.5.0-canary.6
 */
export interface TiktokDestinationOptions {
  /** Erasure cookie-clear seam — TikTok has no per-visitor deletion API, so erasure is cookie-clear and stop-send. */
  clearCookies?: (() => void) | undefined;
  /**
   * Whether delivering under Limited Data Use substitutes for an `ads` grant right now — wire
   * it to the resolved mode being `"opt-out"`. Read per event. Omit to withhold the
   * destination whenever `ads` is denied, the only lawful default under opt-in.
   */
  isLimitedDataUseAllowed?: (() => boolean) | undefined;
  name?: string | undefined;
  /**
   * Delivers one mapped event — the transport seam. Wire it to `ttq.track(...)` (Pixel) or the
   * Events API; this package ships the consent mapping, never the pixel id or network client.
   */
  transport: (payload: TiktokEventPayload) => Promise<void> | void;
}

/**
 * Reference ad destination for TikTok: maps each event and the consent it was admitted under to
 * TikTok's LDU boolean, then hands it to an injected transport. Consent-restriction mapping
 * only — the pixel id and `ttq` transport are the integrator's. `consentRequirement` stays
 * `"required"`.
 *
 * @since 0.5.0-canary.6
 */
export function createTiktokDestination(options: TiktokDestinationOptions): Destination {
  let stopped = false;

  return {
    consentRequirement: "required",
    isPermittedBy: (consent) =>
      toAdConsentState(consent, { isLimitedDataUseAllowed: options.isLimitedDataUseAllowed?.() === true })
        .transmissionAllowed,
    name: options.name ?? "tiktok",
    onErasure() {
      stopped = true;
      options.clearCookies?.();
    },
    async send(event, consent) {
      if (stopped) {
        return;
      }

      await options.transport({
        consent: toTiktokConsent(resolveAdDecision(consent)),
        name: event.name,
        properties: flattenEventProps(event.properties),
      });
    },
  };
}
