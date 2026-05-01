import type { ArrangeRunResult } from "#/domains/arrange/domain/types.domain";

export interface PresentArrangeSyncResultPresenter {
  present(result: ArrangeRunResult, write: boolean): void;
}
