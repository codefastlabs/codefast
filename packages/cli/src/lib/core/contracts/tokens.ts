import { token } from "@codefast/di";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";
import type { RepoRootResolverPort } from "#/lib/core/application/ports/repo-root-resolver.port";
import type { CliRuntime } from "#/lib/core/application/ports/runtime.port";
import type { LoadCodefastConfigUseCase } from "#/lib/core/application/load-codefast-config.use-case";

export const CliFsToken = token<CliFs>("CliFs");
export const CliLoggerToken = token<CliLogger>("CliLogger");
export const CliPathToken = token<CliPath>("CliPath");
export const RepoRootResolverPortToken = token<RepoRootResolverPort>("RepoRootResolverPort");
export const CliRuntimeToken = token<CliRuntime>("CliRuntime");

export const LoadCodefastConfigUseCaseToken = token<LoadCodefastConfigUseCase>(
  "LoadCodefastConfigUseCase",
);
