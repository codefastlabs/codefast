import { Module } from "@codefast/di";
import type { Container } from "@codefast/di";
import { MirrorCommand } from "#/lib/mirror/presentation/mirror.command";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { COMMAND_TOKEN } from "#/lib/kernel/di/command.token";
import { MirrorModule } from "#/lib/mirror/mirror.module";
import { MirrorPresentationModule } from "#/lib/mirror/mirror.presentation.module";

export const MirrorFeatureModule = Module.create("cli-mirror-feature", (moduleBuilder) => {
  moduleBuilder.import(MirrorPresentationModule, MirrorModule);
  moduleBuilder.bind(MirrorCommand).to(MirrorCommand).singleton();
});

export function registerMirrorFeature(runtimeContainer: ReturnType<typeof Container.create>): void {
  runtimeContainer.load(MirrorFeatureModule);
  runtimeContainer.bind(COMMAND_TOKEN).to(MirrorCommand).singleton().whenNamed("mirror");
}

export function resolveMirrorCommand(
  runtimeContainer: ReturnType<typeof Container.create>,
): CliCommand {
  return runtimeContainer.resolve(MirrorCommand);
}
