/** A `Clock` adapter reading the real system time. */

import { injectable } from "@codefast/di";

import type { Clock } from "#/examples/20-explicit-architecture/application/ports/clock.port";

/** Returns the actual current time; tests substitute a fixed clock through the same port. */
@injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
