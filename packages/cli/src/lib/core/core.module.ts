import { Module } from "@codefast/di";
import { nodeCliPath } from "#/lib/core/infra/path.adapter";
import { CliPathToken } from "#/lib/core/contracts/tokens";

export const CoreModule = Module.create("cli-core", (moduleBuilder) => {
  moduleBuilder.bind(CliPathToken).toConstantValue(nodeCliPath);
});
