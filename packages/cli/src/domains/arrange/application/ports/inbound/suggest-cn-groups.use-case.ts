import type { ArrangeSuggestGroupsRequest } from "#/domains/arrange/application/requests/suggest-groups.request";
import type { ArrangeSuggestGroupsOutput } from "#/domains/arrange/contracts/models";

export interface SuggestCnGroupsUseCasePort {
  execute(request: ArrangeSuggestGroupsRequest): ArrangeSuggestGroupsOutput;
}
