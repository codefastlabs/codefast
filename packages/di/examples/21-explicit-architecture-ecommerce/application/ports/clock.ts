/** The outbound port that supplies the current time, so use cases never read the wall clock directly. */

import { token } from "@codefast/di";

/** Answers "what time is it now?" — swappable for a fixed clock in tests. */
export interface Clock {
  /** The current instant. */
  now(): Date;
}

/** The injection token that binds the `Clock` port to its adapter. */
export const ClockToken = token<Clock>("Clock");
