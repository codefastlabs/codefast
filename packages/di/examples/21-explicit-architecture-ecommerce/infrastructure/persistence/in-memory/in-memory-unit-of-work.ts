/** A `UnitOfWork` adapter that runs the work block directly, with no real transaction boundary. */

import { injectable } from "@codefast/di";

import type { UnitOfWork } from "#/examples/21-explicit-architecture-ecommerce/application/ports/unit-of-work";

/** Runs `work` as-is; a real adapter would open a transaction and commit or roll it back around the block. */
@injectable()
export class InMemoryUnitOfWork implements UnitOfWork {
  async run<Result>(work: () => Promise<Result>): Promise<Result> {
    return work();
  }
}
