import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { LoadCodefastConfigUseCase } from "#/lib/core/application/load-codefast-config.use-case";

export const LoadCodefastConfigUseCaseToken: Token<LoadCodefastConfigUseCase> =
  token<LoadCodefastConfigUseCase>("LoadCodefastConfigUseCase");
