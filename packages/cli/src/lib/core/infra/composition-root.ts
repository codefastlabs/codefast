import { Container } from "@codefast/di";
import { ArrangeCommand } from "#commands/arrange";
import { MirrorCommand } from "#commands/mirror";
import { ArrangeModule } from "#lib/arrange/arrange.module";
import { CoreModule } from "#lib/core/core.module";
import { InfraModule } from "#lib/core/infra/infra.module";
import { PresentationModule } from "#lib/core/presentation/presentation.module";
import { COMMAND_TOKEN } from "#lib/core/presentation/tokens";
import { MirrorModule } from "#lib/mirror/mirror.module";
import { TagModule } from "#lib/tag/tag.module";
import { CliGlobalCliRawToken, CliRootDirToken, WorkspaceContextBinderToken } from "#lib/tokens";

export function createCliRuntimeContainer(): ReturnType<typeof Container.create> {
  const di = Container.create();
  di.bind(CliRootDirToken).toConstantValue(process.cwd());
  di.bind(CliGlobalCliRawToken).toConstantValue(undefined);
  const bindWorkspaceContext = (args: {
    readonly rootDir: string;
    readonly globalCliRaw?: unknown;
  }): void => {
    di.rebind(CliRootDirToken).toConstantValue(args.rootDir);
    di.rebind(CliGlobalCliRawToken).toConstantValue(args.globalCliRaw ?? undefined);
  };
  di.bind(WorkspaceContextBinderToken).toConstantValue(bindWorkspaceContext);
  di.load(CoreModule, InfraModule, PresentationModule, ArrangeModule, MirrorModule, TagModule);
  // Module bindings use "last-wins" semantics; CLI commands are intentionally multi-bound.
  di.bind(COMMAND_TOKEN).to(ArrangeCommand).singleton().whenNamed("arrange");
  di.bind(COMMAND_TOKEN).to(MirrorCommand).singleton().whenNamed("mirror");
  return di;
}
