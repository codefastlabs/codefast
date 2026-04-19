import type { GroupFileWorkPlan } from "#/lib/arrange/domain/arrange-grouping.service";

export interface GroupFilePreviewPort {
  printGroupFilePreviewFromWork(work: GroupFileWorkPlan): void;
}
