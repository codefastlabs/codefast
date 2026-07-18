import type { ConsentDecision } from "#/core/consent";
import type { Destination } from "#/core/destination";
import { toAdConsentState } from "#/destinations/ad-consent";
import type { FlatPropertyValue } from "#/destinations/shared";
import { flattenEventProps } from "#/destinations/shared";

/**
 * Meta's `dataProcessingOptions` restriction. `['LDU'], 0, 0` turns on Limited Data Use and
 * lets Meta geolocate the user — the recommended default beyond California, where only
 * country `1` (USA) / state `1000` (California) are documented codes (spec-destinations §5).
 * `[]` applies no restriction.
 */
export interface MetaDataProcessingOptions {
  country: number;
  options: ReadonlyArray<string>;
  state: number;
}

/** Maps a `ConsentDecision` to Meta's `dataProcessingOptions`: LDU when `ads` is denied. */
export function toMetaDataProcessingOptions(decision: ConsentDecision): MetaDataProcessingOptions {
  return toAdConsentState(decision).limitedDataUse
    ? { country: 0, options: ["LDU"], state: 0 }
    : { country: 0, options: [], state: 0 };
}

/** The mapped per-event payload handed to a Meta transport (Pixel `fbq` or a CAPI request). */
export interface MetaEventPayload {
  dataProcessingOptions: MetaDataProcessingOptions;
  name: string;
  properties: Record<string, FlatPropertyValue>;
}

export interface MetaDestinationOptions {
  /**
   * Erasure cookie-clear seam — invoked by `onErasure` to drop Meta's `_fbp`/`_fbc` cookies
   * (spec-data-subject-rights DSR-V4). Meta exposes no per-visitor deletion API, so erasure
   * is cookie-clear + stop-send only. Omit if the integrator clears cookies elsewhere.
   */
  clearCookies?: (() => void) | undefined;
  /** Read per event so an `ads` change restricts data use without recreating the destination. */
  getDecision: () => ConsentDecision;
  name?: string | undefined;
  /**
   * Delivers one mapped event — the transport seam. Wire it to `fbq(...)` (Pixel) or a
   * Conversions API request; this package ships the consent mapping, never the credentials
   * or network client.
   */
  transport: (payload: MetaEventPayload) => Promise<void> | void;
}

/**
 * Reference ad destination: maps each event to Meta's shape and applies Limited Data Use
 * from the live `ads` decision (spec-destinations §5), then hands it to an injected
 * transport. Consent-restriction mapping only — the Pixel/CAPI transport and credentials
 * are the integrator's to supply. `consentRequirement` stays `"required"`: an ad sink is
 * never exempt.
 */
export function createMetaDestination(options: MetaDestinationOptions): Destination {
  // Erasure halts delivery for the rest of the session — Meta has no per-visitor deletion API.
  let stopped = false;

  return {
    consentRequirement: "required",
    name: options.name ?? "meta",
    onErasure() {
      stopped = true;
      options.clearCookies?.();
    },
    async send(event) {
      if (stopped) {
        return;
      }

      await options.transport({
        dataProcessingOptions: toMetaDataProcessingOptions(options.getDecision()),
        name: event.name,
        properties: flattenEventProps(event.properties),
      });
    },
  };
}
