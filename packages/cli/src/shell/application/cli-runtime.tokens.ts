import { token } from "@codefast/di";
import type { CliFs, CliLogger } from "#/shell/application/ports/cli-io.port";
import type { CliPath } from "#/shell/application/ports/path.port";
import type { RepoRootResolverPort } from "#/shell/application/ports/repo-root-resolver.port";
import type { CliRuntime } from "#/shell/application/ports/runtime.port";
import type { TypeScriptSourceFileWalkerPort } from "#/shell/application/ports/typescript-source-file-walker.port";
import type { LoadCodefastConfigUseCase } from "#/shell/application/load-codefast-config.use-case";

export const CliFsToken = token<CliFs>("CliFs");
export const CliLoggerToken = token<CliLogger>("CliLogger");
export const CliPathToken = token<CliPath>("CliPath");
export const RepoRootResolverPortToken = token<RepoRootResolverPort>("RepoRootResolverPort");
export const TypeScriptSourceFileWalkerPortToken = token<TypeScriptSourceFileWalkerPort>(
  "TypeScriptSourceFileWalkerPort",
);
export const CliRuntimeToken = token<CliRuntime>("CliRuntime");

export const LoadCodefastConfigUseCaseToken = token<LoadCodefastConfigUseCase>(
  "LoadCodefastConfigUseCase",
);
