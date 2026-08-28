/** A `Clock` adapter reading the real system time. */

import { injectable } from "@codefast/di";

import type { Clock } from "#/examples/21-explicit-architecture-ecommerce/application/ports/clock";

/** Returns the actual current time; tests substitute a fixed clock through the same port. */
@injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
