/** The outbound port that runs a block of work atomically. */

import { token } from "@codefast/di";

/** Runs `work` inside a single transaction, committing on success and rolling back on error. */
export interface UnitOfWork {
  run<Result>(work: () => Promise<Result>): Promise<Result>;
}

/** The injection token that binds the `UnitOfWork` port to its adapter. */
export const UnitOfWorkToken = token<UnitOfWork>("UnitOfWork");
