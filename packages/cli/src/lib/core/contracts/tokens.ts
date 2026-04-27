import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";
import type { RepoRootResolverPort } from "#/lib/core/application/ports/repo-root-resolver.port";
import type { CliRuntime } from "#/lib/core/application/ports/runtime.port";
import type { LoadCodefastConfigUseCase } from "#/lib/core/application/load-codefast-config.use-case";

export const CliFsToken: Token<CliFs> = token<CliFs>("CliFs");
export const CliLoggerToken: Token<CliLogger> = token<CliLogger>("CliLogger");
export const CliPathToken: Token<CliPath> = token<CliPath>("CliPath");
export const RepoRootResolverPortToken: Token<RepoRootResolverPort> =
  token<RepoRootResolverPort>("RepoRootResolverPort");
export const CliRuntimeToken: Token<CliRuntime> = token<CliRuntime>("CliRuntime");

export const LoadCodefastConfigUseCaseToken: Token<LoadCodefastConfigUseCase> =
  token<LoadCodefastConfigUseCase>("LoadCodefastConfigUseCase");
