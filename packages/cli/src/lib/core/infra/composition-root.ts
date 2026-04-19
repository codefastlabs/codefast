import { Container } from "@codefast/di";
import {
  registerArrangeFeature,
  resolveArrangeCommand,
} from "#/lib/arrange/arrange.feature.module";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { registerMirrorFeature, resolveMirrorCommand } from "#/lib/mirror/mirror.feature.module";
import { registerTagFeature, resolveTagCommand } from "#/lib/tag/tag.feature.module";

export function createCliRuntimeContainer(): ReturnType<typeof Container.create> {
  const runtimeContainer = Container.create();
  registerArrangeFeature(runtimeContainer);
  registerMirrorFeature(runtimeContainer);
  registerTagFeature(runtimeContainer);
  return runtimeContainer;
}

export function resolveCliCommands(
  runtimeContainer: ReturnType<typeof Container.create>,
): readonly CliCommand[] {
  return [
    resolveArrangeCommand(runtimeContainer),
    resolveMirrorCommand(runtimeContainer),
    resolveTagCommand(runtimeContainer),
  ];
}
