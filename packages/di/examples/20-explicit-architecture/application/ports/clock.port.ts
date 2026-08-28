/** The outbound port that supplies the current time, and its token. */

import { token } from "@codefast/di";

/** Answers "what time is it now?" — swappable for a fixed clock in tests. */
export interface Clock {
  /** The current instant. */
  now(): Date;
}

/** The injection token that names the clock port. */
export const ClockToken = token<Clock>("Clock");
