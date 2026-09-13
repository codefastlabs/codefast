import type { ArrangeSuggestGroupsOutput } from "#/arrange/domain/types";
import { logger } from "#/core/logger";

/**
 * Presents the suggested grouping lines for an `arrange group` run.
 *
 * @since 0.11.0
 */
export function presentArrangeGroupResult(output: ArrangeSuggestGroupsOutput): void {
  logger.out(output.primaryLine);
  logger.out(output.bucketsCommentLine);
}
