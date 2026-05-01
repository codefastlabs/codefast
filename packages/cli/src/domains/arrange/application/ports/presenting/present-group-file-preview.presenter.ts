import type { GroupFileWorkPlan } from "#/domains/arrange/domain/arrange-grouping.domain-service";

export interface PresentGroupFilePreviewPresenter {
  printGroupFilePreviewFromWork(work: GroupFileWorkPlan): void;
}
