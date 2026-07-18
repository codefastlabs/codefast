import type { ConsentDecision } from "#/core/consent";
import type { Destination } from "#/core/destination";
import type { FlatPropertyValue } from "#/destinations/shared";
import { flattenEventProps } from "#/destinations/shared";

/**
 * Microsoft UET consent. UET enforces **only** `ad_storage` — it has no `analytics_storage`,
 * and its `ad_user_data`/`ad_personalization` fields have no documented behavior, so this
 * models the one enforced signal (spec-destinations §5). Pushed via
 * `uetq.push('consent','update', …)`.
 */
export interface MicrosoftUetConsent {
  ad_storage: "denied" | "granted";
}

/** Maps a `ConsentDecision` to UET's enforced `ad_storage` signal — driven by `ads`. */
export function toMicrosoftUetConsent(decision: ConsentDecision): MicrosoftUetConsent {
  return { ad_storage: decision.ads ? "granted" : "denied" };
}

/** The mapped per-event payload handed to a UET transport (`uetq.push`). */
export interface MicrosoftUetEventPayload {
  consent: MicrosoftUetConsent;
  name: string;
  properties: Record<string, FlatPropertyValue>;
}

export interface MicrosoftUetDestinationOptions {
  /** Erasure cookie-clear seam — UET exposes no per-visitor deletion API, so erasure is cookie-clear + stop-send (DSR-V4). */
  clearCookies?: (() => void) | undefined;
  /** Read per event so an `ads` change updates `ad_storage` without recreating the destination. */
  getDecision: () => ConsentDecision;
  name?: string | undefined;
  /**
   * Delivers one mapped event — the transport seam. Wire it to `uetq.push(...)`; this package
   * ships the consent mapping, never the tag id or network client.
   */
  transport: (payload: MicrosoftUetEventPayload) => Promise<void> | void;
}

/**
 * Reference ad destination for Microsoft UET: maps each event and the live `ads` decision to
 * UET's `ad_storage` signal, then hands it to an injected transport. Consent-restriction
 * mapping only — the tag id and `uetq` transport are the integrator's. `consentRequirement`
 * stays `"required"`.
 */
export function createMicrosoftUetDestination(options: MicrosoftUetDestinationOptions): Destination {
  let stopped = false;

  return {
    consentRequirement: "required",
    name: options.name ?? "microsoft-uet",
    onErasure() {
      stopped = true;
      options.clearCookies?.();
    },
    async send(event) {
      if (stopped) {
        return;
      }

      await options.transport({
        consent: toMicrosoftUetConsent(options.getDecision()),
        name: event.name,
        properties: flattenEventProps(event.properties),
      });
    },
  };
}
