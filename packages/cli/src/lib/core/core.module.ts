import { Module } from "@codefast/di";
import { nodeCliPath } from "#lib/core/infra/path.adapter";
import { CliPathToken } from "#lib/core/tokens";

export const CoreModule = Module.create("cli-core", (api) => {
  api.bind(CliPathToken).toConstantValue(nodeCliPath);
});
