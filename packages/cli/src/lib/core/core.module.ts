import { Module } from "@codefast/di";
import { CliPathToken } from "#/lib/core/contracts/tokens";
import { NodeCliPathAdapter } from "#/lib/core/infra/path.adapter";

export const CoreModule = Module.create("cli-core", (moduleBuilder) => {
  moduleBuilder.bind(CliPathToken).to(NodeCliPathAdapter).singleton();
});
