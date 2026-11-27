import type { ConsentDecision } from "#core/consent";
import type { TrackedEvent } from "#core/tracked-event";

/**
 * Fan-out target for tracked events. The tracker depends only on this interface, never
 * on a specific provider SDK — destinations own their transport (gtag.js and Vercel both
 * queue and batch in-page), so `send` is fire-and-forget at track time.
 *
 * @since 0.5.0-canary.4
 */
export interface Destination {
  /**
   * "exempt" keeps this destination receiving events while its own consent is not met —
   * only for cookieless, identifier-free sinks: gated envelopes carry no `anonymousId`, and
   * nothing is persisted.
   *
   * @defaultValue "required"
   */
  consentRequirement?: "exempt" | "required" | undefined;
  /**
   * Whether the visitor's effective consent permits this destination to receive identified
   * events — evaluated per event, so each destination is gated on its own purpose.
   *
   * @defaultValue requires `analytics`
   */
  isPermittedBy?: ((consent: ConsentDecision) => boolean) | undefined;
  name: string;
  /**
   * Erase this destination's trace of the subject on withdrawal (spec-data-subject-rights
   * §3): clear the destination's cookies and stop sending, and — where the platform offers
   * one — request per-visitor deletion. Optional: a sink with nothing to erase omits it.
   * Invoked at most once per withdrawal; the tracker swallows its failures.
   */
  onErasure?: ((id: string) => Promise<void> | void) | undefined;
  /** Must always return a `Promise` — mark `send` `async` even if the body has no `await`. */
  send: (event: TrackedEvent) => Promise<void>;
}
