import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { GroupFileWorkPlan } from "#/lib/arrange/domain/arrange-grouping.service";

export interface GroupFilePreviewPort {
  printGroupFilePreviewFromWork(logger: CliLogger, work: GroupFileWorkPlan): void;
}
