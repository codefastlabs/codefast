import { Module } from "@codefast/di";
import { ArrangeModule } from "#/domains/arrange/arrange.module";
import { MirrorModule } from "#/domains/mirror/mirror.module";
import { TagModule } from "#/domains/tag/tag.module";
import { ArrangeCommand } from "#/domains/arrange/presentation/cli/arrange.command";
import { MirrorCommand } from "#/domains/mirror/presentation/cli/mirror.command";
import { TagCommand } from "#/domains/tag/presentation/cli/tag.command";
import { CliCommandPortToken } from "#/shell/composition/tokens";
import { CLI_COMMAND_SLOT_NAME } from "#/shell/contracts/cli-command-slots";

/** Root module: domain wiring plus `CliCommandPortToken` slots (single place for command registration). */
export const CliApplicationModule = Module.create("cli-application", (moduleBuilder) => {
  moduleBuilder.import(ArrangeModule, MirrorModule, TagModule);

  moduleBuilder
    .bind(CliCommandPortToken)
    .to(ArrangeCommand)
    .whenNamed(CLI_COMMAND_SLOT_NAME.arrange)
    .singleton();

  moduleBuilder
    .bind(CliCommandPortToken)
    .to(MirrorCommand)
    .whenNamed(CLI_COMMAND_SLOT_NAME.mirror)
    .singleton();

  moduleBuilder
    .bind(CliCommandPortToken)
    .to(TagCommand)
    .whenNamed(CLI_COMMAND_SLOT_NAME.tag)
    .singleton();
});
