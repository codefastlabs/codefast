import type { TrackedEvent } from "#/core/tracked-event";

/**
 * Fan-out target for tracked events. The tracker depends only on this interface, never
 * on a specific provider SDK — destinations own their transport (gtag.js and Vercel both
 * queue and batch in-page), so `send` is fire-and-forget at track time.
 *
 * @since 0.5.0-canary.4
 */
export interface Destination {
  /**
   * "exempt" keeps this destination receiving events while the tracker's analytics gate
   * is closed — only for cookieless, identifier-free sinks: gated envelopes carry no
   * `anonymousId`, and nothing is persisted.
   *
   * @defaultValue "required"
   */
  consentRequirement?: "exempt" | "required" | undefined;
  name: string;
  /** Must always return a `Promise` — mark `send` `async` even if the body has no `await`. */
  send: (event: TrackedEvent) => Promise<void>;
}
