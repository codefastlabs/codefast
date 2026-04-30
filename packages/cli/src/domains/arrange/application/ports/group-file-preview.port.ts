import type { GroupFileWorkPlan } from "#/domains/arrange/domain/arrange-grouping.service";

export interface GroupFilePreviewPort {
  printGroupFilePreviewFromWork(work: GroupFileWorkPlan): void;
}
